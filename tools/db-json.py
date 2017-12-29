import _mysql
import os

def esc(s):
    return s.replace('"', '\\"').replace('\r\n', '\n').replace('\r', '\n').replace('\n', '\\n')

db = _mysql.connect("localhost", "REDACTED", "REDACTED", "milliondb")

items = {}

db.query("select create_date, title, image, slug, intro, extract, story from story_story where export = 1 order by create_date desc")
r = db.store_result()
for story in r.fetch_row(0):
    context = { 'timestamp': esc(story[0]),
                'title': esc(story[1]),
                'image': esc(story[2]),
                'slug': esc(story[3]),
                'text': esc(story[4]),
                'story': esc(story[4]+"\n\n"+story[5]+"\n\n"+story[6]),
                }
    items[context['timestamp']] = """{"timestamp":"%(timestamp)s",
 "type":"story",
 "title":"%(title)s",
 "image":"%(image)s",
 "slug":"%(slug)s",
 "text":"%(text)s",
 "count":1
}""" % context
    fstory = file('json/story/'+story[3]+'.json', 'wb')
    fstory.write("""{"timestamp":"%(timestamp)s",
 "type":"story",
 "title":"%(title)s",
 "image":"%(image)s",
 "slug":"%(slug)s",
 "text":"%(story)s"
},
""" % context)
    fstory.close()
    if not os.path.exists('stories/'+context['slug']):
        os.makedirs('stories/'+context['slug'])
    print story[3]

db.query("select create_date, title, image, slug, extract from gallery_gallery where export = 1 order by create_date desc")
r = db.store_result()
for gallery in r.fetch_row(0):
    context = { 'timestamp': esc(gallery[0]),
                'title': esc(gallery[1]),
                'image': esc(gallery[2]),
                'slug': esc(gallery[3]),
                'text': esc(gallery[4]),
                }
    items[context['timestamp']] = """{"timestamp":"%(timestamp)s",
 "type":"gallery",
 "title":"%(title)s",
 "image":"%(image)s",
 "slug":"%(slug)s",
 "text":"%(text)s",
 "count":1
}""" % context
    fgallery = file('json/gallery/'+gallery[3]+'.json', 'wb')
    fgallery.write("""{"timestamp":"%(timestamp)s",
 "type":"gallery",
 "title":"%(title)s",
 "slug":"%(slug)s",
 "text":"%(text)s",
 "photos":[]
},
""" % context)
    fgallery.close()
    if not os.path.exists('galleries/'+context['slug']):
        os.makedirs('galleries/'+context['slug'])
    print gallery[3]

findex = file('json/index.json', 'wb')
findex.write("[\n")
findex.write(",\n".join(sorted(items.values(), reverse=True)))
findex.write("]")
findex.close()

