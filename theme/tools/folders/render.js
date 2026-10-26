
imports.gi.versions.Rsvg = '2.0';
const Rsvg = imports.gi.Rsvg;
const Cairo = imports.cairo;
const handle = Rsvg.Handle.new_from_file(ARGV[0]);
const surface = new Cairo.ImageSurface(Cairo.Format.ARGB32, 512, 512);
const cr = new Cairo.Context(surface);
handle.render_document(cr, new Rsvg.Rectangle({x: 0, y: 0, width: 512, height: 512}));
surface.writeToPNG(ARGV[1]);
