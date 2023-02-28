// Account 账户，虚拟管理员和若干业主账号
class Account {
  constructor(accountId, userName, balance) {
    this.AccountId = accountId; //账号ID
    this.userName = userName; //账号名
    this.balance = balance; //余额
  }
}

// RealEstate 房地产作为担保出售、捐赠或质押时Encumbrance为true，默认状态false。
// 仅当Encumbrance为false时，才可发起出售、捐赠或质押
// Proprietor和RealEstateID一起作为复合键,保证可以通过Proprietor查询到名下所有的房产信息
class RealEstate {
  constructor(
    RealEstateID,
    Proprietor,
    balaEncumbrancence,
    TotalArea,
    LivingSpace
  ) {
    this.RealEstateID = RealEstateID; //房地产ID
    this.Proprietor = Proprietor; //所有者(业主)(业主AccountId)
    this.Encumbrance = balaEncumbrancence; //是否作为担保
    this.TotalArea = TotalArea; //总面积
    this.LivingSpace = LivingSpace; //生活空间
  }
}

// Selling 销售要约
// 需要确定ObjectOfSale是否属于Seller
// 买家初始为空
// Seller和ObjectOfSale一起作为复合键,保证可以通过seller查询到名下所有发起的销售
class Selling {
  constructor(
    ObjectOfSale,
    Seller,
    Buyer,
    Price,
    CreateTime,
    SalePeriod,
    SellingStatus
  ) {
    this.ObjectOfSale = ObjectOfSale; //销售对象(正在出售的房地产RealEstateID)
    this.Seller = Seller; //发起销售人、卖家(卖家AccountId)
    this.Buyer = Buyer; //参与销售人、买家(买家AccountId)
    this.Price = Price; //价格
    this.CreateTime = CreateTime; //创建时间
    this.SalePeriod = SalePeriod; //智能合约的有效期(单位为天)
    this.SellingStatus = SellingStatus; //销售状态
  }
}

// SellingStatusConstant 销售状态
function SellingStatusConstant() {
  return {
    saleStart: "销售中", //正在销售状态,等待买家光顾
    cancelled: "已取消", //被卖家取消销售或买家退款操作导致取消
    expired: "已过期", //销售期限到期
    delivery: "交付中", //买家买下并付款,处于等待卖家确认收款状态,如若卖家未能确认收款，买家可以取消并退款
    done: "完成", //卖家确认接收资金，交易完成
  };
}

// SellingBuy 买家参与销售
// 销售对象不能是买家发起的
// Buyer和CreateTime作为复合键,保证可以通过buyer查询到名下所有参与的销售
class SellingBuy {
  constructor(Buyer, CreateTime, Selling) {
    this.Buyer = Buyer; //参与销售人、买家(买家AccountId)
    this.CreateTime = CreateTime; //创建时间
    this.Selling = Selling; //销售对象
  }
}

class Donating {
  constructor(ObjectOfDonating, Donor, Grantee, CreateTime, DonatingStatus) {
    this.ObjectOfDonating = ObjectOfDonating; //捐赠对象(正在捐赠的房地产RealEstateID)
    this.Donor = Donor; //捐赠人(捐赠人AccountId)
    this.Grantee = Grantee; //受赠人(受赠人AccountId)
    this.CreateTime = CreateTime; //创建时间
    this.DonatingStatus = DonatingStatus; //捐赠状态
  }
}

// DonatingStatusConstant 捐赠状态
function DonatingStatusConstant() {
  return {
    donatingStart: "捐赠中", //捐赠人发起捐赠合约，等待受赠人确认受赠
    cancelled: "已取消", //捐赠人在受赠人确认受赠之前取消捐赠或受赠人取消接收受赠
    done: "完成", //受赠人确认接收，交易完成
  };
}

// DonatingGrantee 供受赠人查询的
class DonatingGrantee {
  constructor(Grantee, CreateTime, Donating) {
    this.Grantee = Grantee; //受赠人(受赠人AccountId)
    this.CreateTime = CreateTime; //创建时间
    this.Donating = Donating; //捐赠对象
  }
}

module.exports.Account = Account;
module.exports.RealEstate = RealEstate;
module.exports.Selling = Selling;
module.exports.SellingStatusConstant = SellingStatusConstant;
module.exports.SellingBuy = SellingBuy;
module.exports.Donating = Donating;
module.exports.DonatingStatusConstant = DonatingStatusConstant;
module.exports.DonatingGrantee = DonatingGrantee;

module.exports.AccountKey = "account-key";
module.exports.RealEstateKey = "real-estate-key";
module.exports.SellingKey = "selling-key";
module.exports.SellingBuyKey = "selling-buy-key";
module.exports.DonatingKey = "donating-key";
module.exports.DonatingGranteeKey = "donating-grantee-key";
