# Agile List

Typically, Agile Projects (Kanban, Scrum, etc) have one board per project, or even one board per sprint.
But what if you have a lot of smallish projects? That gets to be a lot of lists. It would be nice to be
able to have one list per project, so that one board can contain a bunch of projects. This powerup is
intended to provide reporting (Release Projection, per user stats, etc.) for a single list.

You can add story points to any card by clicking the "Story Points" button. These story points will also 
be displayed in a badge on the front of the card. You can *also* add story points to checklist items 
by prepending the item with a number in brackets. (Currently these story points are not added to the 
badge total on the front of the card. Holy feature request, batman!).

# Installation

## Pre-requisites

```
sudo apt install nodejs
sudo apt install npm
sudo apt install authbind

sudo touch /etc/authbind/byport/80
# substitute username of user that will start server for %user% below
sudo chown %user% /etc/authbind/byport/80
sudo chmod 755 /etc/authbind/byport/80

npm install -g pm2
```

Then clone app and start

```
git clone https://github.com/erikor/agile-list
cd agile-list
npm install

export PORT=80
# --watch flag is optional, only useful in devel
authbind --deep pm2 server.js --watch --name agile
```
