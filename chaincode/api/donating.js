const utils = require("../pkg/utils/fabric");
const model = require("../model/model");

const shim = require("fabric-shim");

// CreateDonating 发起捐赠
function CreateDonating(stub, args) {
  // 验证参数
  if (args.length != 3) {
    return shim.error("参数个数不满足");
  }
  let objectOfDonating = args[0];
  let donor = args[1];
  let grantee = args[2];
  if (objectOfDonating === "" || donor === "" || grantee === "") {
    return shim.error("参数存在空值");
  }
  if (donor === grantee) {
    return shim.error("捐赠人和受赠人不能同一人");
  }
  //判断objectOfDonating是否属于donor
  let resultsRealEstate = utils.GetStateByPartialCompositeKeys2(
    stub,
    model.RealEstateKey,
    [donor, objectOfDonating]
  );
  if (resultsRealEstate.length !== 1) {
    return shim.error(`验证${objectOfDonating}属于${donor}失败: ${err}`);
  }

  let realEstate;
  try {
    realEstate = JSON.parse(resultsRealEstate[0]);
  } catch (err) {
    return shim.Error(`CreateDonating-反序列化出错: ${err}`);
  }

  //根据grantee获取受赠人信息
  let resultsAccount = utils.GetStateByPartialCompositeKeys(
    stub,
    model.AccountKey,
    grantee
  );
  if (resultsAccount.length !== 1) {
    return shim.error(`grantee受赠人信息验证失败`);
  }

  let accountGrantee;
  try {
    accountGrantee = JSON.parse(resultsAccount[0]);
  } catch (err) {
    return shim.error(`查询操作人信息-反序列化出错: ${err}`);
  }

  if (accountGrantee.UserName === "管理员") {
    return shim.error(`不能捐赠给管理员`);
  }

  //判断记录是否已存在，不能重复发起捐赠
  //若Encumbrance为true即说明此房产已经正在担保状态
  if (realEstate.Encumbrance) {
    return shim.error("此房地产已经作为担保状态，不能再发起捐赠");
  }

  let createTime = stub.GetTxTimestamp();
  let donating = {
    ObjectOfDonating: objectOfDonating,
    Donor: donor,
    Grantee: grantee,
    CreateTime: `time.Unix(int64(createTime.GetSeconds()), int64(createTime.GetNanos())).Local().Format("2006-01-02 15:04:05")`,
    DonatingStatus: model.DonatingStatusConstant()["donatingStart"],
  };

  // 写入账本
  utils.WriteLedger(donating, stub, model.DonatingKey, [
    donating.Donor,
    donating.ObjectOfDonating,
    donating.Grantee,
  ]);
  //将房子状态设置为正在担保状态
  realEstate.Encumbrance = true;
  utils.WriteLedger(realEstate, stub, model.RealEstateKey, [
    realEstate.Proprietor,
    realEstate.RealEstateID,
  ]);

  //将本次购买交易写入账本,可供受赠人查询
  donatingGrantee = {
    Grantee: grantee,
    CreateTime: `time.Unix(int64(createTime.GetSeconds()), int64(createTime.GetNanos())).Local().Format("2006-01-02 15:04:05")`,
    Donating: donating,
  };

  utils.WriteLedger(donatingGrantee, stub, model.DonatingGranteeKey, [
    donatingGrantee.Grantee,
    donatingGrantee.CreateTime,
  ]);

  let donatingGranteeByte = JSON.stringify(donatingGrantee);
  // 成功返回
  return shim.success(donatingGranteeByte);
}

// QueryDonatingList 查询捐赠列表(可查询所有，也可根据发起捐赠人查询)(发起的)(供捐赠人查询)
async function QueryDonatingList(stub, args) {
  let donatingList = [];
  let results = await utils.GetStateByPartialCompositeKeys2(
    stub,
    model.DonatingKey,
    args
  );
  for (const result of results) {
    let donating;
    try {
      donating = JSON.parse(result);
    } catch (err) {
      return shim.error(`QueryDonatingList-反序列化出错: ${err}`);
    }
    donatingList.push(donating);
  }
  let donatingListByte = JSON.stringify(donatingList);
  return shim.success(donatingListByte);
}

// QueryDonatingListByGrantee 根据受赠人(受赠人AccountId)查询捐赠(受赠的)(供受赠人查询)
function QueryDonatingListByGrantee(stub, args) {
  if (args.length !== 1) {
    return shim.error(`必须指定受赠人AccountId查询`);
  }
  let donatingGranteeList = [];
  let results = utils.GetStateByPartialCompositeKeys2(
    stub,
    model.DonatingGranteeKey,
    args
  );
  for (const result of results) {
    let donatingGrantee;
    try {
      donatingGrantee = JSON.parse(donatingGrantee);
    } catch (err) {
      return shim.Error(`QueryDonatingListByGrantee-反序列化出错: ${err}`);
    }
    donatingGranteeList.push(donatingGrantee);
  }
  let donatingGranteeListByte = JSON.stringify(donatingGranteeList);
  return shim.success(donatingGranteeListByte);
}

// UpdateDonating 更新捐赠状态（确认受赠、取消）
function UpdateDonating(stub, args) {
  // 验证参数
  if (args.length !== 4) {
    return shim.error("参数个数不满足");
  }
  let objectOfDonating = args[0];
  let donor = args[1];
  let grantee = args[2];
  let status = args[3];
  if (
    objectOfDonating === "" ||
    donor === "" ||
    grantee === "" ||
    status === ""
  ) {
    return shim.error("参数存在空值");
  }
  if (donor === grantee) {
    return shim.error("捐赠人和受赠人不能同一人");
  }
  //根据objectOfDonating和donor获取想要购买的房产信息，确认存在该房产
  let resultsRealEstate = utils.GetStateByPartialCompositeKeys2(
    stub,
    model.RealEstateKey,
    [donor, objectOfDonating]
  );
  if (resultsRealEstate.length !== 1) {
    return shim.error(
      `根据${objectOfDonating}和${donor}获取想要购买的房产信息失败`
    );
  }
  let realEstate;
  try {
    realEstate = JSON.parse(resultsRealEstate[0]);
  } catch (err) {
    return shim.error(`UpdateDonating-反序列化出错: ${err}`);
  }
  //根据grantee获取受赠人
  let resultsGranteeAccount = utils.GetStateByPartialCompositeKeys(
    stub,
    model.AccountKey,
    [grantee]
  );
  if (resultsGranteeAccount.legnth() !== 1) {
    return shim.error(`grantee受赠人信息验证失败${err}`);
  }
  let accountGrantee;
  try {
    accountGrantee = JSON.parse(resultsGranteeAccount[0]);
  } catch (err) {
    return shim.error(`查询grantee受赠人信息-反序列化出错: ${err}`);
  }
  //根据objectOfDonating和donor和grantee获取捐赠信息
  let resultsDonating = utils.GetStateByPartialCompositeKeys2(
    stub,
    model.DonatingKey,
    [donor, objectOfDonating, grantee]
  );
  if (resultsDonating.length !== 1) {
    return shim.error(
      `根据${objectOfDonating}和${donor}和${grantee}获取销售信息失败`
    );
  }
  let donating;
  try {
    donating = JSON.parse(resultsDonating[0]);
  } catch (err) {
    return shim.error(`UpdateDonating-反序列化出错`);
  }
  //不管完成还是取消操作,必须确保捐赠处于捐赠中状态
  if (
    donating.DonatingStatus !== model.DonatingStatusConstant()["donatingStart"]
  ) {
    return shim.error("此交易并不处于捐赠中，确认/取消捐赠失败");
  }
  //根据grantee获取买家购买信息donatingGrantee
  let donatingGrantee;
  let resultsDonatingGrantee = utils.GetStateByPartialCompositeKeys2(
    stub,
    model.DonatingGranteeKey,
    [grantee]
  );
  if (resultsDonatingGrantee.length === 0) {
    return shim.error(`根据${grantee}获取受赠人信息失败`);
  }
  for (const result of resultsDonatingGrantee) {
    let s;
    try {
      s = JSON.parse(result);
    } catch (err) {
      return shim.error(`UpdateDonating-反序列化出错: ${err}`);
    }
    if (
      s.Donating.ObjectOfDonating === objectOfDonating &&
      s.Donating.Donor === donor &&
      s.Grantee === grantee
    ) {
      //还必须判断状态必须为交付中,防止房子已经交易过，只是被取消了
      if (
        s.Donating.DonatingStatus ===
        model.DonatingStatusConstant()["donatingStart"]
      ) {
        donatingGrantee = s;
        break;
      }
    }
  }
  let data;
  //判断捐赠状态
  switch (status) {
    case "done":
      //将房产信息转入受赠人，并重置担保状态
      realEstate.Proprietor = grantee;
      realEstate.Encumbrance = false;
      //realEstate.RealEstateID = stub.GetTxID() //重新更新房产ID
      utils.WriteLedger(realEstate, stub, model.RealEstateKey, [
        realEstate.Proprietor,
        realEstate.RealEstateID,
      ]);
      //清除原来的房产信息
      utils.DelLedger(stub, model.RealEstateKey, [donor, objectOfDonating]);
      //捐赠状态设置为完成，写入账本
      donating.DonatingStatus = model.DonatingStatusConstant()["done"];
      donating.ObjectOfDonating = realEstate.RealEstateID; //重新更新房产ID
      utils.WriteLedger(donating, stub, model.DonatingKey, [
        donating.Donor,
        objectOfDonating,
        grantee,
      ]);
      donatingGrantee.Donating = donating;
      utils.WriteLedger(donatingGrantee, stub, model.DonatingGranteeKey, [
        donatingGrantee.Grantee,
        donatingGrantee.CreateTime,
      ]);
      data, (err = JSON.stringify(donatingGrantee));
      break;
    case "cancelled":
      //重置房产信息担保状态
      realEstate.Encumbrance = false;
      utils.WriteLedger(realEstate, stub, model.RealEstateKey, [
        realEstate.Proprietor,
        realEstate.RealEstateID,
      ]);

      //更新捐赠状态
      donating.DonatingStatus = model.DonatingStatusConstant()["cancelled"];
      utils.WriteLedger(donating, stub, model.DonatingKey, [
        donating.Donor,
        donating.ObjectOfDonating,
        donating.Grantee,
      ]);
      donatingGrantee.Donating = donating;
      utils.WriteLedger(donatingGrantee, stub, model.DonatingGranteeKey, [
        donatingGrantee.Grantee,
        donatingGrantee.CreateTime,
      ]);
      data = JSON.stringify(donatingGrantee);
      break;
    default:
      return shim.error(`${status}状态不支持`);
  }
  return shim.success(data);
}
