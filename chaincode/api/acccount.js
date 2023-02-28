const shim = require("fabric-shim");
const utils = require("../pkg/utils/fabric");

// QueryAccountList 查询账户列表
async function QueryAccountList(stub, args) {
  let accountList = [];
  let results = await utils.GetStateByPartialCompositeKeys(
    stub,
    model.AccountKey,
    args
  );
  for (const result of results) {
    try {
      account = JSON.parse(result);
    } catch (err) {
      return shim.error(`QueryAccountList-反序列化出错: ${err}`);
    }
    accountList = append(accountList, account);
  }
  let accountListByte = JSON.stringify(accountList);
  return shim.success(accountListByte);
}
