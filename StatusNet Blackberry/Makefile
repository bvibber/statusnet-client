DESKTOP_BASE=../StatusNet Desktop/Resources
MOBILE_BASE=../StatusNet Mobile/Resources
HEYQUERY=../heyQuery/Resources
DEST=Resources

all:
	cp "$(MOBILE_BASE)/app.js" "$(DEST)"
	cp "$(MOBILE_BASE)/statusnet.js" "$(DEST)"
	cp "$(MOBILE_BASE)/statusnet_client.js" "$(DEST)"

	test -d "$(DEST)/lib" || mkdir "$(DEST)/lib"
	rsync -av "$(DESKTOP_BASE)/lib/" "$(DEST)/lib/"
	test -d "$(DEST)/model" || mkdir "$(DEST)/model"
	rsync -av "$(DESKTOP_BASE)/model/" "$(DEST)/model/"
	rsync -av "$(HEYQUERY)/sizzle.js" "$(DEST)/sizzle.js"
	rsync -av "$(HEYQUERY)/heyQuery.js" "$(DEST)/heyQuery.js"
