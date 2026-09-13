import Foundation
import CoreGraphics
import ImageIO

// Reports the bounding box of non-white pixels: where the source photo actually
// landed inside the padded canvas. A stretched export fills the whole canvas;
// a correctly letterboxed one occupies a box with the source's aspect ratio.
for path in CommandLine.arguments.dropFirst() {
  guard let src = CGImageSourceCreateWithURL(URL(fileURLWithPath: path) as CFURL, nil),
        let img = CGImageSourceCreateImageAtIndex(src, 0, nil) else {
    print("\(path) ERROR unreadable"); continue
  }
  let w = img.width, h = img.height
  var buf = [UInt8](repeating: 0, count: w * h * 4)
  let cs = CGColorSpaceCreateDeviceRGB()
  guard let ctx = CGContext(data: &buf, width: w, height: h, bitsPerComponent: 8,
                            bytesPerRow: w * 4, space: cs,
                            bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue) else {
    print("\(path) ERROR ctx"); continue
  }
  ctx.draw(img, in: CGRect(x: 0, y: 0, width: w, height: h))
  var minX = w, minY = h, maxX = -1, maxY = -1
  for y in 0..<h {
    for x in 0..<w {
      let o = (y * w + x) * 4
      let sum = Int(buf[o]) + Int(buf[o+1]) + Int(buf[o+2])
      if sum < 720 {                       // not near-pure-white
        if x < minX { minX = x }; if x > maxX { maxX = x }
        if y < minY { minY = y }; if y > maxY { maxY = y }
      }
    }
  }
  if maxX < 0 { print("\(path) \(w)x\(h) ALL-WHITE"); continue }
  print("\(path) canvas=\(w)x\(h) box=\(minX),\(minY),\(maxX+1),\(maxY+1) content=\(maxX+1-minX)x\(maxY+1-minY)")
}
