#create config dir
echo 'create config dir'
mkdir ./config

#config db
echo ++++ config db ++++

echo 'enter database host'
read dbhost
echo 'your database host '$dbhost

echo 'enter database user'
read dbuser
echo 'your database user '$dbuser

echo 'enter database port'
read dbport
echo 'your database port '$dbport

echo 'enter database password'
read dbpw
echo 'your database password '$dbpw

echo 'enter name of database'
read database
echo 'your name of database '$database

echo '{ "host":"'$dbhost'", "user":"'$dbuser'", "port":'$dbport', "password":"'$dbpw'", "database":"'$database'" }' > ./config/dbconfig.json

echo ++++ config mysql session ++++
echo 'enter secret key'
read secret
echo 'your secret key '$secret

echo 'enter resave ( true || false )'
read resave
echo 'your secret resave '$resave

echo 'enter saveUninitialized ( true || false )'
read saveUninitialized
echo 'your secret saveUninitialized '$saveUninitialized

echo '{ "secret": "'$secret'", "resave":'$resave', "saveUninitialized":'$saveUninitialized' }' > ./config/mysql-session.json
