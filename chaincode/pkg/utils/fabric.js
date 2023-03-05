const shim = require("fabric-shim");

// WriteLedger 写入账本
async function WriteLedger(obj, stub, objectType, keys) {
  let compositekey = stub.CreateCompositeKey(objectType, keys);
  let bytes = JSON.stringify(obj);
  //写入区块链账本
  await stub.PutState(compositekey, bytes);
}

// DelLedger 删除账本
async function DelLedger(stub, objectType, keys) {
  //创建复合主键
  let compositekey = CreateCompositeKey(objectType, keys);
  //写入区块链账本
  await stub.DelState(compositekey);
}

// GetStateByPartialCompositeKeys 根据复合主键查询数据(适合获取全部，多个，单个数据)
// 将keys拆分查询
async function GetStateByPartialCompositeKeys(stub, objectType, keys) {
  let results = [];
  if (keys.length == 0) {
    // 传入的keys长度为0，则查找并返回所有数据
    // 通过主键从区块链查找相关的数据，相当于对主键的模糊查询
    let resultIterator = stub.GetStateByPartialCompositeKey(objectType, keys);
    //检查返回的数据是否为空，不为空则遍历数据，否则返回空数组
    for await (const res of resultIterator) {
      results.push(res.value.toString("utf8"));
    }
    resultIterator.Close();
  } else {
    // 传入的keys长度不为0，查找相应的数据并返回
    for (let key of keys) {
      let compositeKey = CreateCompositeKey(objectType, key);
      let bytes = await stub.GetState(compositeKey);
      results.push(bytes);
    }
  }
  return results;
}

// GetStateByPartialCompositeKeys2 根据复合主键查询数据(适合获取全部或指定的数据)
async function GetStateByPartialCompositeKeys2(stub, objectType, keys) {
  let result = [];
  // 通过主键从区块链查找相关的数据，相当于对主键的模糊查询
  let resultIterator = stub.GetStateByPartialCompositeKey(objectType, keys);

  //检查返回的数据是否为空，不为空则遍历数据，否则返回空数组
  for await (const res of resultIterator) {
    results.push(results, val.value.toString("utf8"));
  }
  resultIterator.Close();
  return results;
}

module.exports.WriteLedger = WriteLedger;
module.exports.DelLedger = DelLedger;
module.exports.GetStateByPartialCompositeKeys = GetStateByPartialCompositeKeys;
module.exports.GetStateByPartialCompositeKeys2 =
  GetStateByPartialCompositeKeys2;
