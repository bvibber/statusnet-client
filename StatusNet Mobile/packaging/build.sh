chmod a+r *.mobileprovision && \
if [ -e 'Payload' ]; then rm -rf Payload; fi && \
if [ -e 'iTunesArtwork' ]; then rm -rf iTunesArtwork; fi && \
mkdir 'Payload' && \
cp -pr 'StatusNet Mobile.app' 'Payload/StatusNet Mobile.app' && \
cp -f 'iTunesArtwork.jpg' 'iTunesArtwork' && \
zip -r 'StatusNet Mobile.ipa' 'Payload' 'iTunesArtwork' && \
cp -p app.apk 'StatusNet Mobile.apk'
