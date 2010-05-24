BASE=../StatusNet Desktop/Resources
DEST=Resources

all:
	test -d "$(DEST)/lib" || mkdir "$(DEST)/lib"
	rsync -av "$(BASE)/lib/" "$(DEST)/lib/"
	test -d "$(DEST)/model" || mkdir "$(DEST)/model"
	rsync -av "$(BASE)/model/" "$(DEST)/model/"
