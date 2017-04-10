#create config dir
echo 'create config dir'
mkdir ./config

#config db
echo '++++ config db ++++'

echo 'enter database host'
read dbhost
echo

echo 'enter database user'
read dbuser
echo

echo 'enter database port'
read dbport
echo

echo 'enter database password'
read dbpw
echo

echo '{ "host":"'$dbhost'", "user":"'$dbuser'", "port":'$dbport', "password":"'$dbpw'", "database":"heungchat" }' > ./config/dbconfig.json
echo

echo '++++ config mysql session ++++'
echo 'enter secret key'
read secret
echo

echo 'enter resave ( true || false )'
read resave
echo

echo 'enter saveUninitialized ( true || false )'
read saveUninitialized
echo

echo '{ "secret": "'$secret'", "resave":'$resave', "saveUninitialized":'$saveUninitialized' }' > ./config/mysql-session.json
echo

echo '++++ create database and table ++++'
mysql -h$dbhost -u$dbuser -p -e 'source ./db/db.sql'
echo 

echo 'configuration is done'
echo 'start application using start.sh!!'
echo