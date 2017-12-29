"""Million Galleries Tools
(c) 2012 Marc Boeren
"""
import os
import sys
import math
from PIL import Image
from PIL import ImageFilter

#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#

def rounddown(f):
    return (int)(math.floor(f)+0.00001)

def list_files(directory, extlist = None, depth = -1):
    """Return a list of files (including relative pathnames) found in
    the given directory that have a match in the given extension-list.
    Subdirectories are included up to a given depth. The filenames do
    not include the base directory.

    Parameters:
        directory: base directory to start the listing in
        extlist: list of allowed extension, e.g. [".jpg", ".gif"]
            if not specified or empty: any extension is allowed
        depth: max. depth to descend subdirectories
            if not specified all subdirectories are descended into

    Example:
        filelist = tools.list_files("sourcedir", [".jpg", ".gif"])
    """
    dirlist = [os.path.normcase(f) for f in os.listdir(directory)]
    filepaths = [f for f in dirlist if os.path.isfile(os.path.join(directory, f)) and (not extlist or os.path.splitext(f)[1] in extlist)]
    #for p in dirlist:
    #    if depth and os.path.isdir(os.path.join(directory, p)):
    #        filepaths+= [os.path.join(p, f) for f in list_files(os.path.join(directory, p), extlist, depth-1)]
    return filepaths

def convert_images(sourcedir, destdir, variations, callback = None):
    """Convert images from a folder plus all subfolders. The identical subfolder
structure will be copied to the destination folder. The images will be sized
to a max-box (i.e. aspect ratio will be preserved, image is downscaled so it
fits entirely in the box (note: NO upscale!)) and saved in the destination
format. Alternatively a portion of the image can be cropped, it will auto-select
a maximum box from the center and scale it down to the given dimensions.

    Parameters:
        sourcedir: source directory for conversion
        destdir: destination directory for converted images
        variations: a list of different variations of each image, defined by
            name: append this to the original name (before the extension)
            crop: a tuple of width, height
            maxpixels: resize the image so it contains no more than the given number
                       of pixels (width * height)

    Dependencies:
        list_files()
    """
    filelist = list_files(sourcedir, ['.jpg',])
    f = open(os.path.join(sourcedir, 'index.json'), 'w')
    f.write('[');
    sep = ''
    n = 0
    #    src.has_key('ext') and src['ext'] or None)
    for filepath in filelist:
        for variation in variations:
            img = None
            if 1:
                img = Image.open(os.path.join(sourcedir, filepath))
                if img.mode == '1':
                    img = img.convert("L")
                elif img.mode == 'L':
                    pass
                img = img.convert('RGB')
                imgsize = img.size
                imgratio = 1.0 * imgsize[0]/imgsize[1]

                if 'crop' in variation:
                    destratio = 1.0 * variation['crop'][0]/variation['crop'][1]
                    if imgratio < destratio: # width bound
                        w = variation['crop'][0]
                        h = rounddown((1.0*w/imgsize[0])*imgsize[1])
                        yoffset = rounddown((h - variation['crop'][1]) / 2.0)
                        xoffset = 0
                        destsize = (w, h)
                    else: # height bound
                        h = variation['crop'][1]
                        w = rounddown((1.0*h/imgsize[1])*imgsize[0])
                        xoffset = rounddown((w - variation['crop'][0]) / 2.0)
                        yoffset = 0
                        destsize = (w, h)
                    img.thumbnail(destsize, Image.ANTIALIAS) # right scale
                    box = (xoffset, yoffset, variation['crop'][0]+xoffset, variation['crop'][1]+yoffset)
                    img = img.crop(box)
                    #imgcopy = img.resize(variation['crop']) # right size canvas
                    #print destsize, variation['crop'], img.size, imgcopy.size, box
                    #imgcopy.paste(img, box)
                    #img = imgcopy
                    #img = img.filter(ImageFilter.SHARPEN)
                    pass
                elif 'maxpixels' in variation:
                    h = math.sqrt((1.0*variation['maxpixels'])/imgratio)
                    w = imgratio * h
                    h = rounddown(h)
                    w = rounddown(w)
                    destsize = (w, h)
                    img.thumbnail(destsize, Image.ANTIALIAS)
                    #print imgsize, variation['maxpixels'], imgratio, destsize, w*h
                    #img = img.filter(ImageFilter.SHARPEN)
                    pass
                else:
                    # plain copy
                    pass

                try:
                    basedir, filename= os.path.split(filepath)
                    directory = os.path.join(destdir, basedir)
                    if not os.path.exists(directory):
                        os.makedirs(directory)
                    destfile =  os.path.splitext(filename)[0]+variation['name']+'.jpg'
                    img.save(os.path.join(directory, destfile))
                    if callback:
                        callback(os.path.join(sourcedir, filepath),
                                 os.path.join(directory, destfile),
                                 imgsize
                                 )
                except:
                    print("Save error:", filepath)
            #except:
            #    print "Open error:", filepath
            del img
        f.write(sep + '{"name":"' + os.path.splitext(filename)[0] + '", "size":[' + str(imgsize[0]) + ', ' + str(imgsize[1]) + ']}\n');
        sep = ','
        n+= 1
    f.write(']\n');
    f.write(str(n));
