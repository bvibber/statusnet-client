.fake: all desktop mobile tablet blackberry clean

#all: desktop mobile tablet blackberry
all: desktop mobile tablet

desktop:

mobile:
	(cd 'StatusNet Mobile' && make)

tablet:
	(cd 'StatusNet Tablet' && make)

blackberry:
	(cd 'StatusNet Blackberry' && make)

clean:
	(cd 'StatusNet Mobile' && make clean)
	(cd 'StatusNet Tablet' && make clean)
	#(cd 'StatusNet Blackberry' && make clean)
