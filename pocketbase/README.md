# pocketbase/

This folder holds the PocketBase server binary (gitignored; only this README is committed).

## Download

The latest stable release for Linux amd64:

```
curl -sL -o pb.zip "https://github.com/pocketbase/pocketbase/releases/download/v0.40.6/pocketbase_0.40.6_linux_amd64.zip"
unzip -o pb.zip -d pocketbase/
rm pb.zip
```

For other OS/arch, pick the matching asset from:
https://github.com/pocketbase/pocketbase/releases

Place the executable at `./pocketbase/pocketbase` and make it executable (`chmod +x pocketbase/pocketbase`).

## Run

```
npm run pb:serve
# serves on http://127.0.0.1:8090
```

Admin UI: http://127.0.0.1:8090/_/

## Setup

Create the superuser (password must be at least 10 characters):

```
./pocketbase/pocketbase superuser upsert admin@ledgerlens.test 'Admin-Demo-12345!'
```

Then seed the database:

```
npm run pb:setup
```
