//! logic_fn-0.0.4.js
function logic_fn(e, r) {
  ((r = r || {}).so = r.space_is_or), (r.sa = r.space_is_and), r.get || (r.get = ["i[", "]"]);
  var a = { "&": "&&", AND: "&&", "|": "||", OR: "||", "-": "!", "!": "!", NOT: "!", "(": "(", ")": ")", "\\": "\\" },
    p = [],
    c = [],
    g = //g,
    l = //g,
    t = r.sa || r.so ? / +/g : null,
    n = r.sa ? "&&" : "||";
  if (
    ((e = e
      .trim()
      .replace(/\\(&|AND|\||OR|-|!|NOT|\(|\)|\\)/g, (e, r) => (p.push(r), ""))
      .replace(/\\"/g, "")
      .replace(/\\'/g, "")
      .replace(/"([^"]*)"/g, (e, r) => (c.push(r), ""))
      .replace(/ *([^ \\]?)(&|AND|\||OR|-|!|NOT|\(|\)|\\) */g, (e, r, p) => r + a[p])
      .replace(t, n)
      .replace(/([^!&|(])(!*)\(/g, (e, r, a) => r + "&&" + a + "(")
      .replace(/[^"&|!()\\-]+/g, (e) => (e in a ? e : ((e = e.replace(g, '\\"').replace(l, "'")), r.get[0] + '"' + e + '"' + r.get[1])))
      .replace(//g, () => p.shift())
      .replace(//g, () => c.shift())),
    r.return_expr)
  )
    return e;
  if (r.return_literals) {
    var s = [];
    return e.replace(/i\["(.*?)"\]/g, (e, r) => s.push(r.replace(/\\"/g, '"'))), s;
  }
  return new Function("i", "return ".concat(e, ";"));
}
export { logic_fn };
