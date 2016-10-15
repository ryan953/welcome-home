mkfile_path := $(abspath $(lastword $(MAKEFILE_LIST)))
working_dir := $(dir $(mkfile_path))

# TODO get this from the env
ME := 501

define PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>Label</key>
	<string>com.ryan953.welcome-home</string>
	<key>ProgramArguments</key>
	<array>
		<string>./build/index.js</string>
	</array>
	<key>WorkingDirectory</key>
  <string>$(working_dir)</string>
	<key>EnvironmentVariables</key>
  <dict>
      <key>PATH</key>
      <string><![CDATA[$(PATH)]]></string>
  </dict>
	<key>KeepAlive</key>
	<true/>
	<key>StandardOutPath</key>
	<string>$(working_dir)log/welcome-home.log</string>
	<key>StandardErrorPath</key>
	<string>$(working_dir)log/welcome-home.log</string>
</dict>
</plist>
endef

.PHONEY: install
.PHONEY: install-plist
.PHONEY: build-js
.PHONEY: reload-service
.PHONEY: remove-service
.PHONEY: print-service

default: build-js

install:
	npm install

install-plist: export PLIST:=$(PLIST)
install-plist:
	mkdir -p ./log

	echo "$${PLIST}" > ~/Library/LaunchAgents/com.ryan953.welcome-home.plist
	chmod 600 ~/Library/LaunchAgents/com.ryan953.welcome-home.plist

	launchctl bootstrap gui/${ME} ~/Library/LaunchAgents/com.ryan953.welcome-home.plist

build-js:
	npm run build

reload-service:
	launchctl bootout gui/${ME} ~/Library/LaunchAgents/com.ryan953.welcome-home.plist
	launchctl bootstrap gui/${ME} ~/Library/LaunchAgents/com.ryan953.welcome-home.plist

remove-service:
	launchctl bootout gui/${ME} ~/Library/LaunchAgents/com.ryan953.welcome-home.plist

print-service:
	launchctl print gui/${ME}/com.ryan953.welcome-home
