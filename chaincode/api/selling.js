const shim = require("fabric-shim");
const utils = require("../pkg/utils/fabric");

// CreateSelling 发起销售
function CreateSelling(stub, args) {
  // 验证参数
  if (args.length() !== 4) {
    return shim.error("参数个数不满足");
  }
  let objectOfSale = args[0];
  let seller = args[1];
  let price = args[2];
  let salePeriod = args[3];
  if (
    objectOfSale === "" ||
    seller === "" ||
    price === "" ||
    salePeriod === ""
  ) {
    return shim.error("参数存在空值");
  }
  // 参数数据格式转换
  let formattedPrice;
  let val = parseFloat(price);
  if (val === NaN) {
    return shim.error(`price参数格式转换出错: ${err}`);
  } else {
    formattedPrice = val;
  }
  var formattedSalePeriod;
  val = parseInt(salePeriod);
  if (val === NaN) {
    return shim.error(`salePeriod参数格式转换出错: ${err}`);
  } else {
    formattedSalePeriod = val;
  }
  //判断objectOfSale是否属于seller
  let resultsRealEstate = utils.GetStateByPartialCompositeKeys2(
    stub,
    model.RealEstateKey,
    [seller, objectOfSale]
  );
  if (resultsRealEstate.length() !== 1) {
    return shim.error(`验证${objectOfSale}属于${seller}失败`);
  }
  let realEstate;
  try {
    realEstate = JSON.parse(resultsRealEstate[0]);
  } catch (err) {
    return shim.error(`CreateSelling-反序列化出错: ${err}`);
  }
  //判断记录是否已存在，不能重复发起销售
  //若Encumbrance为true即说明此房产已经正在担保状态
  if (realEstate.Encumbrance) {
    return shim.error("此房地产已经作为担保状态，不能重复发起销售");
  }
  let createTime = stub.GetTxTimestamp();
  let selling = {
    ObjectOfSale: objectOfSale,
    Seller: seller,
    Buyer: "",
    Price: formattedPrice,
    CreateTime: `time.Unix(int64(createTime.GetSeconds()), int64(createTime.GetNanos())).Local().Format("2006-01-02 15:04:05")`,
    SalePeriod: formattedSalePeriod,
    SellingStatus: model.SellingStatusConstant()["saleStart"],
  };
  // 写入账本
  utils.WriteLedger(selling, stub, model.SellingKey, [
    selling.Seller,
    selling.ObjectOfSale,
  ]);
  //将房子状态设置为正在担保状态
  realEstate.Encumbrance = true;
  utils.WriteLedger(realEstate, stub, model.RealEstateKey, [
    realEstate.Proprietor,
    realEstate.RealEstateID,
  ]);
  //将成功创建的信息返回
  let sellingByte = JSON.stringify(selling);
  // 成功返回
  return shim.success(sellingByte);
}

// CreateSellingByBuy 参与销售(买家购买)
function CreateSellingByBuy(stub, args) {
  // 验证参数
  if (args.length() !== 3) {
    return shim.error("参数个数不满足");
  }
  let objectOfSale = args[0];
  let seller = args[1];
  let buyer = args[2];
  if (objectOfSale === "" || seller === "" || buyer === "") {
    return shim.error("参数存在空值");
  }
  if (seller == buyer) {
    return shim.error("买家和卖家不能同一人");
  }
  //根据objectOfSale和seller获取想要购买的房产信息，确认存在该房产
  let resultsRealEstate = utils.GetStateByPartialCompositeKeys2(
    stub,
    model.RealEstateKey,
    [seller, objectOfSale]
  );
  if (resultsRealEstate.length() !== 1) {
    return shim.error(
      fmt.Sprintf(
        "根据%s和%s获取想要购买的房产信息失败: %s",
        objectOfSale,
        seller,
        err
      )
    );
  }
  //根据objectOfSale和seller获取销售信息
  let resultsSelling = utils.GetStateByPartialCompositeKeys2(
    stub,
    model.SellingKey,
    [seller, objectOfSale]
  );
  if (resultsSelling.length() !== 1) {
    return shim.error(
      fmt.Sprintf("根据%s和%s获取销售信息失败: %s", objectOfSale, seller, err)
    );
  }
  let selling;
  try {
    selling = JSON.parse(resultsSelling[0]);
  } catch (err) {
    return shim.error(`CreateSellingBuy-反序列化出错: ${err}`);
  }
  //判断selling的状态是否为销售中
  if (selling.SellingStatus !== model.SellingStatusConstant()["saleStart"]) {
    return shim.error("此交易不属于销售中状态，已经无法购买");
  }
  //根据buyer获取买家信息
  let resultsAccount = utils.GetStateByPartialCompositeKeys(
    stub,
    model.AccountKey,
    [buyer]
  );
  if (len(resultsAccount) !== 1) {
    return shim.error(`buyer买家信息验证失败${err}`);
  }
  let buyerAccount;
  try {
    buyerAccount = JSON.parse(resultsAccount[0]);
  } catch (err) {
    return shim.error(`查询buyer买家信息-反序列化出错: ${err}`);
  }
  if (buyerAccount.UserName === "管理员") {
    return shim.error(`管理员不能购买`);
  }
  //判断余额是否充足
  if (buyerAccount.Balance < selling.Price) {
    return shim.error(
      `房产售价为${selling.Price},您的当前余额为${buyerAccount.Balance},购买失败`
    );
  }
  //将buyer写入交易selling,修改交易状态
  selling.Buyer = buyer;
  selling.SellingStatus = model.SellingStatusConstant()["delivery"];
  utils.WriteLedger(
    selling,
    stub,
    model.SellingKey,
    selling.Seller,
    selling.ObjectOfSale
  );
  let createTime = stub.GetTxTimestamp();
  //将本次购买交易写入账本,可供买家查询
  sellingBuy = {
    Buyer: buyer,
    CreateTime: `time.Unix(int64(createTime.GetSeconds()), int64(createTime.GetNanos())).Local().Format("2006-01-02 15:04:05")`,
    Selling: selling,
  };
  utils.WriteLedger(sellingBuy, stub, model.SellingBuyKey, [
    sellingBuy.Buyer,
    sellingBuy.CreateTime,
  ]);
  let sellingBuyByte = JSON.stringify(sellingBuy);
  //购买成功，扣取余额，更新账本余额，注意，此时需要卖家确认收款，款项才会转入卖家账户，此处先扣除买家的余额
  buyerAccount.Balance -= selling.Price;
  utils.WriteLedger(buyerAccount, stub, model.AccountKey, [
    buyerAccount.AccountId,
  ]);
  // 成功返回
  return shim.success(sellingBuyByte);
}

// QuerySellingList 查询销售(可查询所有，也可根据发起销售人查询)(发起的)(供卖家查询)
function QuerySellingList(stub, args) {
  let sellingList = [];
  let results = utils.GetStateByPartialCompositeKeys2(
    stub,
    model.SellingKey,
    args
  );
  for (const result of results) {
    let selling;
    try {
      selling = JSON.parse(result);
    } catch (err) {
      return shim.error(`QuerySellingList-反序列化出错: ${err}`);
    }
    sellingList.push(selling);
  }
  sellingListByte = JSON.stringify(sellingList);
  return shim.success(sellingListByte);
}

// QuerySellingListByBuyer 根据参与销售人、买家(买家AccountId)查询销售(参与的)(供买家查询)
function QuerySellingListByBuyer(stub, args) {
  if (args.length() !== 1) {
    return shim.error(`必须指定买家AccountId查询`);
  }
  let sellingBuyList = [];
  let results = utils.GetStateByPartialCompositeKeys2(
    stub,
    model.SellingBuyKey,
    args
  );
  for (const result of results) {
    let sellingBuy;
    try {
      sellingBuy = JSON.parse(result);
    } catch (err) {
      return shim.error(`QuerySellingListByBuyer-反序列化出错: ${err}`);
    }
    sellingBuyList.push(sellingBuy);
  }
  let sellingBuyListByte = JSON.stringify(sellingBuyList);
  return shim.success(sellingBuyListByte);
}

// UpdateSelling 更新销售状态（买家确认、买卖家取消）
function UpdateSelling(stub, args) {
  // 验证参数
  if (args.length() !== 4) {
    return shim.error("参数个数不满足");
  }
  let objectOfSale = args[0];
  let seller = args[1];
  let buyer = args[2];
  let status = args[3];
  if (objectOfSale === "" || seller === "" || status === "") {
    return shim.error("参数存在空值");
  }
  if (buyer === seller) {
    return shim.error("买家和卖家不能同一人");
  }
  //根据objectOfSale和seller获取想要购买的房产信息，确认存在该房产
  let resultsRealEstate = utils.GetStateByPartialCompositeKeys2(
    stub,
    model.RealEstateKey,
    [seller, objectOfSale]
  );
  if (resultsRealEstate.length() !== 1) {
    return shim.error(
      `根据${objectOfSale}和${seller}获取想要购买的房产信息失败`
    );
  }
  let realEstate;
  try {
    realEstate = JSON.parse(resultsRealEstate[0]);
  } catch (err) {
    return shim.error(`UpdateSellingBySeller-反序列化出错: ${err}`);
  }
  //根据objectOfSale和seller获取销售信息
  let resultsSelling = utils.GetStateByPartialCompositeKeys2(
    stub,
    model.SellingKey,
    [seller, objectOfSale]
  );
  if (resultsSelling !== 1) {
    return shim.error(`根据${objectOfSale}和${seller}获取销售信息失败`);
  }
  let selling;
  try {
    selling = JSON.parse(resultsSelling[0]);
  } catch (err) {
    return shim.error(`UpdateSellingBySeller-反序列化出错`);
  }
  //根据buyer获取买家购买信息sellingBuy
  let sellingBuy;
  //如果当前状态是saleStart销售中，是不存在买家的
  if (selling.SellingStatus !== model.SellingStatusConstant()["saleStart"]) {
    let resultsSellingByBuyer = utils.GetStateByPartialCompositeKeys2(
      stub,
      model.SellingBuyKey,
      [buyer]
    );
    if (resultsSellingByBuyer.length() === 0) {
      return shim.error(`根据${buyer}获取买家购买信息失败`);
    }
    for (const result of resultsSellingByBuyer) {
      let s;
      try {
        s = JSON.parse(result);
      } catch (err) {
        return shim.error(`UpdateSellingBySeller-反序列化出错: ${err}`);
      }
      if (
        s.Selling.ObjectOfSale === objectOfSale &&
        s.Selling.Seller === seller &&
        s.Buyer === buyer
      ) {
        //还必须判断状态必须为交付中,防止房子已经交易过，只是被取消了
        if (
          s.Selling.SellingStatus === model.SellingStatusConstant()["delivery"]
        ) {
          sellingBuy = s;
          break;
        }
      }
    }
  }
  let data = [];
  //判断销售状态
  switch (status) {
    case "done":
      //如果是买家确认收款操作,必须确保销售处于交付状态
      if (selling.SellingStatus !== model.SellingStatusConstant()["delivery"]) {
        return shim.error("此交易并不处于交付中，确认收款失败");
      }
      //根据seller获取卖家信息
      let resultsSellerAccount = utils.GetStateByPartialCompositeKeys(
        stub,
        model.AccountKey,
        { seller }
      );
      if (resultsSellerAccount.length() !== 1) {
        return shim.error(`seller卖家信息验证失败`);
      }
      let accountSeller;
      try {
        accountSeller = JSON.parse(resultsSellerAccount[0]);
      } catch (err) {
        return shim.error(`查询seller卖家信息-反序列化出错: ${err}`);
      }
      //确认收款,将款项加入到卖家账户
      accountSeller.Balance += selling.Price;
      utils.WriteLedger(accountSeller, stub, model.AccountKey, [
        accountSeller.AccountId,
      ]);
      //将房产信息转入买家，并重置担保状态
      realEstate.Proprietor = buyer;
      realEstate.Encumbrance = false;
      //realEstate.RealEstateID = stub.GetTxID() //重新更新房产ID
      utils.WriteLedger(realEstate, stub, model.RealEstateKey, [
        realEstate.Proprietor,
        realEstate.RealEstateID,
      ]);
      //清除原来的房产信息
      utils.DelLedger(stub, model.RealEstateKey, [seller, objectOfSale]);
      //订单状态设置为完成，写入账本
      selling.SellingStatus = model.SellingStatusConstant()["done"];
      selling.ObjectOfSale = realEstate.RealEstateID; //重新更新房产ID
      utils.WriteLedger(selling, stub, model.SellingKey, [
        selling.Seller,
        objectOfSale,
      ]);
      sellingBuy.Selling = selling;
      utils.WriteLedger(sellingBuy, stub, model.SellingBuyKey, [
        sellingBuy.Buyer,
        sellingBuy.CreateTime,
      ]);
      data = JSON.stringify(sellingBuy);
      break;
    case "cancelled":
      data = closeSelling(
        "cancelled",
        selling,
        realEstate,
        sellingBuy,
        buyer,
        stub
      );
      break;
    case "expired":
      data = closeSelling(
        "expired",
        selling,
        realEstate,
        sellingBuy,
        buyer,
        stub
      );
      break;
    default:
      return shim.error(`${status}状态不支持`);
  }
  return shim.success(data);
}

// closeSelling 不管是取消还是过期，都分两种情况
// 1、当前处于saleStart销售状态
// 2、当前处于delivery交付中状态
function closeSelling(
  closeStart,
  selling,
  realEstate,
  sellingBuy,
  buyer,
  stub
) {
  switch (selling.SellingStatus) {
    case model.SellingStatusConstant()["saleStart"]:
      selling.SellingStatus = model.SellingStatusConstant()[closeStart];
      //重置房产信息担保状态
      realEstate.Encumbrance = false;
      utils.WriteLedger(realEstate, stub, model.RealEstateKey, [
        realEstate.Proprietor,
        realEstate.RealEstateID,
      ]);
      utils.WriteLedger(selling, stub, model.SellingKey, [
        selling.Seller,
        selling.ObjectOfSale,
      ]);
      data = JSON.parse(selling);
      return data, nil;
    case model.SellingStatusConstant()["delivery"]:
      //根据buyer获取卖家信息
      let resultsBuyerAccount = utils.GetStateByPartialCompositeKeys(
        stub,
        model.AccountKey,
        [buyer]
      );
      if (resultsBuyerAccount.length() !== 1) {
        return null;
      }
      let accountBuyer;
      try {
        accountBuyer = JSON.parse(resultsBuyerAccount[0]);
      } catch (err) {
        return null;
      }
      //此时取消操作，需要将资金退还给买家
      accountBuyer.Balance += selling.Price;
      utils.WriteLedger(accountBuyer, stub, model.AccountKey, [
        accountBuyer.AccountId,
      ]);
      //重置房产信息担保状态
      realEstate.Encumbrance = false;
      utils.WriteLedger(realEstate, stub, model.RealEstateKey, [
        realEstate.Proprietor,
        realEstate.RealEstateID,
      ]);
      //更新销售状态
      selling.SellingStatus = model.SellingStatusConstant()[closeStart];
      utils.WriteLedger(selling, stub, model.SellingKey, [
        selling.Seller,
        selling.ObjectOfSale,
      ]);
      sellingBuy.Selling = selling;
      utils.WriteLedger(sellingBuy, stub, model.SellingBuyKey, [
        sellingBuy.Buyer,
        sellingBuy.CreateTime,
      ]);
      data = JSON.stringify(sellingBuy);
      return data;
    default:
      return null;
  }
}
