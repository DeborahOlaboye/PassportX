#!/bin/bash
for i in {1..100}
do
  echo $i > notification_counter.txt
  git add notification_counter.txt
  git commit -m "Increment notification counter to $i"
done