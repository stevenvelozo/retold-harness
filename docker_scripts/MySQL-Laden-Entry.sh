#!/bin/bash

trap 'kill -TERM $PID' TERM INT

# Start the Visual Studio Code Server
/usr/bin/entrypoint.sh --bind-addr "0.0.0.0:8080" . &

PID=$!

sleep 2

# Start the MariaDB Server
sudo service mariadb restart

# Wait a bit over a minute for the server to come up
LOOP_LIMIT=30
for (( i=0 ; ; i++ )); do
	if [ ${i} -eq ${LOOP_LIMIT} ]; then
		echo "Time out. Error log is shown as below:"
		tail -n 100 ${LOG}
		exit 1
	fi
	echo "=> Waiting for confirmation of MySQL service startup; attempt ${i} of ${LOOP_LIMIT} ..."
	sleep 2
	mysql -u root -p"123456789" -e "status" > /dev/null 2>&1 && break
done

echo "=> MySQL service startup finished. <="

# This junk below is *quite complex* because we want to run as the synthesized user pulled in to match the user in our environment
#    FOR POSTERITY: Running bash in interactive mode, trying to manually source the bashrc, etc. all failed due to
#                   the complex way docker and the base image set the user (we have an explicit user ID).  This method
#                   works but is ugly as heck.
# Install the latest pm2 process manager
export HOME=/home/coder
bash -i <(echo "npm install pm2 -g")
# Install the dependencies for node
bash -i <(echo "npm install")
# Now run the harness API within the pm2 process manager
# Twiddling for posterity (these didn't work)
#bash -c "pm2 start /home/coder/retold-harness/source/Retold-Harness.js"
#bash --init-file <(echo "source /home/coder/.bashrc && pm2 start /home/coder/retold-harness/source/Retold-Harness.js")
bash -i <(echo "pm2 start /home/coder/retold-harness/source/Retold-Harness.js")

wait $PID
trap - TERM INT
wait $PID
EXIT_STATUS=$?
echo "Service exited with status ${EXIT_STATUS}"