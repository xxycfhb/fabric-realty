const shim = require("fabric-shim");

const utils = require("../pkg/utils/fabric");

function Hello(stub, args) {
  utils.WriteLedger({ msg: "hello" }, stub, "hello", []);
  return shim.Success("hello world");
}
