SHARED=../StatusNet Desktop/Resources
MOBILE=../StatusNet Mobile/Resources
HEYQUERY=../heyQuery/Resources
DEST=Resources

all:
	rsync -av "$(MOBILE)/" "$(DEST)/"
	test -d "$(DEST)/lib" || mkdir "$(DEST)/lib"
	rsync -av "$(SHARED)/lib/" "$(DEST)/lib/"
	test -d "$(DEST)/model" || mkdir "$(DEST)/model"
	rsync -av "$(SHARED)/model/" "$(DEST)/model/"
	rsync -av "$(HEYQUERY)/sizzle.js" "$(DEST)/sizzle.js"
	rsync -av "$(HEYQUERY)/heyQuery.js" "$(DEST)/heyQuery.js"


clean:
	rm -rf "$(DEST)/"
