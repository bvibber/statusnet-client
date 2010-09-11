BASE=../StatusNet Desktop/Resources
HEYQUERY=../heyQuery/Resources
DEST=Resources

all:
	test -d "$(DEST)/lib" || mkdir "$(DEST)/lib"
	rsync -av "$(BASE)/lib/" "$(DEST)/lib/"
	test -d "$(DEST)/model" || mkdir "$(DEST)/model"
	rsync -av "$(BASE)/model/" "$(DEST)/model/"
	rsync -av "$(HEYQUERY)/sizzle.js" "$(DEST)/sizzle.js"
	rsync -av "$(HEYQUERY)/heyQuery.js" "$(DEST)/heyQuery.js"

clean:
	rm -rf "$(DEST)/lib"
	rm -rf "$(DEST)/model"
	rm -f "$(DEST)/sizzle.js"
	rm -f "$(DEST)/heyQuery.js"
