#!/bin/bash

service mariadb restart

sleep 2

source /root/.bashrc
npm install
npm start

node ./source/Retold-Harness.js
