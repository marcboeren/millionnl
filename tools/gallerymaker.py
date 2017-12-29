"""Million Galleries
(c) 2012 Marc Boeren
"""
import sys
import gallerytools

#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#

variations = [{'name': '-full'},
              {'name': '-thumb@2x', 'crop':(320,212)},
              {'name': '-thumb', 'crop':(160,106)},
              {'name': '@2x', 'maxpixels':3145728}, # 2048 * 1536
              {'name': '', 'maxpixels':786432},     # 1024 *  768
              ]

#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#

def reporter(src, dst, size):
    print(src, '=>', dst, '(', size[0], 'x', size[1], ')')

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: gallerymaker.py foldername")
    else:
        sourcedir = sys.argv[-1]
        destdir = sourcedir + '/gallery'
        gallerytools.convert_images(sourcedir,
                                    destdir,
                                    variations,
                                    reporter
                                    )
