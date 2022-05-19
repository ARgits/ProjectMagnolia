function createDataPath(object) {
  let newObject = {};
  let path = [];
  let originalObject = object;
  function iterateOverObject(object) {
    for (let [key, item] of Object.entries(object)) {
      path.push(key);
      if (typeof item === "object") {
        iterateOverObject(item);
      } else {
        let check = checkProp(originalObject, path);
        if (check) {
          newObject[check.path.join(".")] = check.value;
          if (path.length > 0) {
            path.pop();
          }
        } else path = [];
      }
    }
  }
  function checkProp(obj, currentPath) {
    let origObj = obj;
    let testObj = obj;
    for (let i = 0; i < path.length; i++) {
      if (typeof testObj[currentPath[i]] === "object") {
        testObj = testObj[currentPath[i]];
      } else if (testObj[currentPath[i]] !== undefined) {
        return { path: currentPath, value: testObj[currentPath[i]] };
      } else {
        if (currentPath.length > 1) {
          currentPath.splice(i - 1, 1);
        } else currentPath.shift();
        if (currentPath.length > 0) {
          return checkProp(origObj, currentPath);
        } else return false;
      }
    }
  }
  iterateOverObject(object);
  return newObject;
}
function recurse(parts) {
  if (parts.length == 1)
      return parts[0];
  // else
  var obj = {};
  obj[parts.shift()] = recurse(parts);
  return obj;
}
