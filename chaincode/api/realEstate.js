const shim = require("fabric-shim");
const utils = require("../pkg/utils/fabric");

// CreateRealEstate 新建房地产(管理员)
function CreateRealEstate(stub, args) {
  // 验证参数
  if (args.length !== 4) {
    return shim.Error("参数个数不满足");
  }
  let accountId = args[0]; //accountId用于验证是否为管理员
  let proprietor = args[1];
  let totalArea = args[2];
  let livingSpace = args[3];
  if (
    accountId === "" ||
    proprietor === "" ||
    totalArea === "" ||
    livingSpace === ""
  ) {
    return shim.error("参数存在空值");
  }
  if (accountId === proprietor) {
    return shim.error("操作人应为管理员且与所有人不能相同");
  }
  // 参数数据格式转换
  let formattedTotalArea;
  let val = parseFloat(totalArea);
  if (formattedLivingSpace === NaN) {
    return shim.error(`totalArea参数格式转换出错: ${err}`);
  } else {
    formattedTotalArea = val;
  }
  let formattedLivingSpace;
  val = parseFloat(livingSpace);
  if (val === Nan) {
    return shim.error(`livingSpace参数格式转换出错: ${err}`);
  } else {
    formattedLivingSpace = val;
  }
  //判断是否管理员操作
  let resultsAccount = utils.GetStateByPartialCompositeKeys(
    stub,
    model.AccountKey,
    [accountId]
  );
  if (resultsAccount.length !== 1) {
    return shim.error(`操作人权限验证失败${err}`);
  }
  let account;
  try {
    account = JSON.parse(resultsAccount[0]);
  } catch (err) {
    return shim.error(`查询操作人信息-反序列化出错: ${err}`);
  }
  if (account.UserName !== "管理员") {
    return shim.error(`操作人权限不足${err}`);
  }
  //判断业主是否存在
  let resultsProprietor = utils.GetStateByPartialCompositeKeys(
    stub,
    model.AccountKey,
    [proprietor]
  );
  if (resultsProprietor.length !== 1) {
    return shim.error(`业主proprietor信息验证失败${err}`);
  }
  let realEstate = {
    RealEstateID: stub.GetTxID(),
    Proprietor: proprietor,
    Encumbrance: false,
    TotalArea: formattedTotalArea,
    LivingSpace: formattedLivingSpace,
  };
  // 写入账本
  utils.WriteLedger(realEstate, stub, model.RealEstateKey, [
    realEstate.Proprietor,
    realEstate.RealEstateID,
  ]);
  //将成功创建的信息返回
  let realEstateByte = JSON.parse(realEstate);
  // 成功返回
  return shim.success(realEstateByte);
}

// QueryRealEstateList 查询房地产(可查询所有，也可根据所有人查询名下房产)
function QueryRealEstateList(stub, args) {
  let realEstateList = [];
  let results = utils.GetStateByPartialCompositeKeys2(
    stub,
    model.RealEstateKey,
    args
  );
  for (const result of results) {
    let realEstate;
    try {
      realEstate = JSON.parse(result);
    } catch (err) {
      return shim.error(`QueryRealEstateList-反序列化出错: ${err}`);
    }
    realEstateList.push(realEstate);
  }
  let realEstateListByte = JSON.stringify(realEstateList);
  return shim.success(realEstateListByte);
}
