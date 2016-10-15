# Install

```
git clone https://github.com/ryan953/welcome-home.git
npm install
cp config.json.example config.json
open config.json
npm start
```

# Editing your config.json

To properly get setup you'll need to edit the config.json file and add some information specific to your own network. You can copy the example file to get started like so `cp config.json.example config.json`.

The config file with one device configured looks like this:

```
{
  "broadcast": "192.168.0.255",
  "frequency": 5000,
  "hosts": [
    {
      "mac": "aa:bb:cc:dd:ee:ff",
      "alias": "Some Nice Name",
      "appeared": {
        "GET": [
          "http://example.com?message=Welcome"
        ],
        "POST": [
        ],
      },
      "removed": {
        "GET": [
        ],
        "POST": [
          "http://example.com?message=Bye"
        ]
      }
    }
  ]
}
```

## Find your broadcast address

Try this:

```
ifconfig | grep broadcast
```

Then add that ip address to the config file.

## Find your Mac Address

You'll have to figure this out on a per-device basis. Maybe check your router or the Network settings on the device you want to detect.
