const shim = require("fabric-shim");
// const model = require("./model/model");

const Chaincode = class {
  async Init(stub) {
    // console.log("链码初始化");
    // //初始化默认数据
    // let accountIds = [
    //   "5feceb66ffc8",
    //   "6b86b273ff34",
    //   "d4735e3a265e",
    //   "4e07408562be",
    //   "4b227777d4dd",
    //   "ef2d127de37b",
    // ];
    // let userNames = [
    //   "管理员",
    //   "①号业主",
    //   "②号业主",
    //   "③号业主",
    //   "④号业主",
    //   "⑤号业主",
    // ];
    // let balances = [0, 5000000, 5000000, 5000000, 5000000, 5000000];
    // //初始化账号数据
    // for (let i = 0; i < accountIds.length; ++i) {
    //   let account = model.Account(accountIds[i], userNames[i], balances[i]);
    //   try {
    //     WriteLedger(account, stub, model.AccountKey, accountIds[i]);
    //   } catch (err) {
    //     return shim.error(fmt.Sprintf("%s", err));
    //   }
    // }
    // return shim.success(Buffer.from("Initialized successfully!"));
  }

  async Invoke(stub) {
    // let ret = stub.getFunctionAndParameters();
    // let funcName = ret.fcn;
    // let args = ret.params;
    // switch (funcName) {
    //   case "hello":
    //     return api.Hello(stub, args);
    //   case "queryAccountList":
    //     return api.QueryAccountList(stub, args);
    //   case "createRealEstate":
    //     return api.CreateRealEstate(stub, args);
    //   case "queryRealEstateList":
    //     return api.QueryRealEstateList(stub, args);
    //   case "createSelling":
    //     return api.CreateSelling(stub, args);
    //   case "createSellingByBuy":
    //     return api.CreateSellingByBuy(stub, args);
    //   case "querySellingList":
    //     return api.QuerySellingList(stub, args);
    //   case "querySellingListByBuyer":
    //     return api.QuerySellingListByBuyer(stub, args);
    //   case "updateSelling":
    //     return api.UpdateSelling(stub, args);
    //   case "createDonating":
    //     return api.CreateDonating(stub, args);
    //   case "queryDonatingList":
    //     return api.QueryDonatingList(stub, args);
    //   case "queryDonatingListByGrantee":
    //     return api.QueryDonatingListByGrantee(stub, args);
    //   case "updateDonating":
    //     return api.UpdateDonating(stub, args);
    //   default:
    //     return shim.error(`没有该功能: ${funcName}`);
    // }
    // return shim.success(Buffer.from("success"));
  }
};

shim.start(new Chaincode());
