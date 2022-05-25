import _ from "lodash";
import { v4 as uuidv4 } from "uuid";
import jp from "jsonpath";
import { EventEmitter } from "events";
const eventEmitter = new EventEmitter.EventEmitter();

export class Choice {
  private typeId: any = {};
  private posId: any = {};
  private IdinId: any = {};
  private IdLength: any = {};

  private IdResult: any = {};
  private nexts: any[] = [];
  sampleData: any = {};
  condition: any = {};
  private status:boolean=true
  constructor(condition: any, data: any) {
    this.typeId = {};
    this.posId= {};
    this.IdinId = {};
    this.IdLength = {};
 
    this.IdResult = {};
    this.condition = condition 
    this.sampleData = data;
    this.IdLength["orig"] = this.condition.Choices.length;
    this.status = true;
  }

  public start(){
    return new Promise((resolve,rejet)=>{

    
    eventEmitter.on("scream", (d) => {

      this.status = false;
      d = d.filter((item: any) => {
        return item !== undefined;
        
      });
      if(d.length == 0) {
            this.nexts = [];

          resolve(this.condition.Default)
      }
      else {
        this.nexts = [];

      resolve(d[0]);
      }
    });
    this.condition.Choices.map((item: any) => {
      if (this.status) {
        if (_.has(item, "Or")) {
          item.Id = uuidv4();
          this.typeId[item.Id] = "Or";
          this.posId[item.Id] = "root";
          this.IdLength[item.Id] = item.Or.length;
          this.checkFunction(item.Or, "Or", item.Id);
        } else if (_.has(item, "And")) {
          item.Id = uuidv4();
          this.typeId[item.Id] = "And";
          this.posId[item.Id] = "root";
          this.IdLength[item.Id] = item.And.length;
          this.checkFunction(item.And, "And", item.Id);
        } else if (_.has(item, "Not")) {
          item.Id = uuidv4();
          this.typeId[item.Id] = "Not";
          this.posId[item.Id] = "root";
          this.checkFunction(item.Not, "Not", item.Id);
        } else {
          item.Id = uuidv4();
          this.typeId[item.Id] = "Simple";
          this.posId[item.Id] = "root";
          this.IdResult[item.Id] = this.simpleHandler(this.sampleData, item);
          this.resultTracker(item.Id);
        }
      } else return this.status;
    });
})
  }

  private checkFunction(arr: any, type: string, upperId: string) {
    if (type == "And" || type == "Or") {
      arr.map((item: any) => {
        if (_.has(item, "Or")) {
          item.Id = uuidv4();
          this.typeId[item.Id] = "Or";
          this.IdinId[item.Id] = upperId;
          this.IdLength[item.Id] = item.Or.length;
          this.checkFunction(item.Or, "Or", item.Id);
        } else if (_.has(item, "And")) {
          item.Id = uuidv4();
          this.typeId[item.Id] = "And";
          this.IdinId[item.Id] = upperId;
          this.IdLength[item.Id] = arr.length;
          this.checkFunction(item.And, "And", item.Id);
        } else if (_.has(item, "Not")) {
          item.Id = uuidv4();
          this.typeId[item.Id] = "Not";
          this.IdinId[item.Id] = upperId;
          this.checkFunction(item.Not, "Not", item.Id);
        } else {
          item.Id = uuidv4();
          this.typeId[item.Id] = "Simple";
          this.IdinId[item.Id] = upperId;
          this.IdResult[item.Id] = this.simpleHandler(this.sampleData, item);
          this.resultTracker(item.Id);
        }
      });
    } else if (type == "Not") {
      if (_.has(arr, "Or")) {
        arr.Id = uuidv4();
        this.typeId[arr.Id] = "Or";
        this.IdinId[arr.Id] = upperId;
        this.IdLength[arr.Id] = arr.Or.length;
        this.checkFunction(arr.Or, "Or", arr.Id);
      } else if (_.has(arr, "And")) {
        arr.Id = uuidv4();
        this.typeId[arr.Id] = "And";
        this.IdinId[arr.Id] = upperId;
        this.IdLength[arr.Id] = arr.And.length;
        this.checkFunction(arr.And, "And", arr.Id);
      } else if (_.has(arr, "Not")) {
        arr.Id = uuidv4();
        this.typeId[arr.Id] = "Not";
        this.IdinId[arr.Id] = upperId;
        this.checkFunction(arr.Not, "Not", arr.Id);
      } else {
        arr.Id = uuidv4();
        this.typeId[arr.Id] = "Simple";
        this.IdinId[arr.Id] = upperId;
        this.IdResult[arr.Id] = this.simpleHandler(this.sampleData, arr);
        this.resultTracker(arr.Id);
      }
    }
  }

 public emptyData(){
    eventEmitter.on("scream", (d) => {
        this.typeId = {};
        this.posId= {};
        this.IdinId = {};
        this.IdLength = {};
        this.IdResult = {};
        this.sampleData = {};
        this.condition = {}
    })
  }

  private getObjKey(obj:any, value:any) {
    let t:any[] = []
    Object.keys(obj).forEach(item=>{
        if(obj[item]==value) t.push(item)
    })
    return t
  } 
  private resultTracker(Id: string) {
    // check for condition for root state

    if (Object.keys(this.posId).includes(Id)) {
      if (this.IdResult[Id]) {
        let next: any = _.find(this.condition.Choices, function (o) {
          return o.Id == Id;
        }).Next;
        this.nexts.push(next);
        eventEmitter.emit("scream", this.nexts);
      } else {
        this.nexts.push(undefined);
        if (this.nexts.length == this.IdLength["orig"]) {
            eventEmitter.emit("scream", this.nexts);
        }
      }
    } else {
      // check for condition if upper condition is Not
      var upperId = this.IdinId[Id];
      if (this.typeId[upperId] == "Not") {
        this.IdResult[upperId] = !this.IdResult[Id];
        this.resultTracker(upperId);
      }
      // check for condition if upper condition is And
      if (this.typeId[upperId] == "And") {
        var and_result = this.getObjKey(this.IdinId, upperId);
        if (and_result.length == this.IdLength[upperId]) {
          and_result = and_result.map((item: any) => this.IdResult[item]);
          this.IdResult[upperId] = and_result.includes(false);
          this.resultTracker(upperId);
        }
      }
      // check for condition if upper condition is Or
      if (this.typeId[upperId] == "Or") {
        var or_result = this.getObjKey(this.IdinId, upperId);
        if (or_result.length == this.IdLength[upperId]) {
          or_result = or_result.map((item: any) => this.IdResult[item]);
          this.IdResult[upperId] = or_result.includes(true);
          this.resultTracker(upperId);
        }
      }
    }
  }
  private simpleHandler (data:any, condition:any) {
    
    if (_.has(condition, "IsTimestamp")) {
      return new Date(jp.query(data,condition.Variable)[0]).getTime() > 0 && new Date(jp.query(data,condition.Variable)[0]).getTime() !=NaN;
    }
    else if (_.has(condition, "IsPresent")) {
      return jp.query(data,condition.Variable)[0] !== undefined;
    }
    else if (_.has(condition,"IsNumeric")){
      return jp.query(typeof data,condition.Variable)[0] == "number";

    }
    else if (_.has(condition,"IsBoolean")){
      return jp.query(typeof data,condition.Variable)[0] == "boolean";

    }
    else if (_.has(condition,"IsString")){
      return jp.query(typeof data,condition.Variable)[0] == "string";


    }
    else if (_.has(condition,"IsNull")){
      return jp.query(data,condition.Variable)[0] !== null;


    }
    else if (_.has(condition,"NumericEquals")){
      return jp.query(data,condition.Variable)[0] == condition.NumericEquals
    }
    else if (_.has(condition,"StringEquals")){
      return jp.query(data,condition.Variable)[0] == condition.StringEquals


    }
    else if (_.has(condition,"TimestampEquals")){
      return new Date(jp.query(data,condition.Variable)[0]) == new Date(condition.TimestampEquals)


    }
    else if (_.has(condition,"NumericGreaterThan")){
      return jp.query(data,condition.Variable)[0] > condition.NumericGreaterThan


    }
    else if (_.has(condition,"StringGreaterThan")){
      return jp.query(data,condition.Variable)[0].includes(condition.StringGreaterThan)&& 
      jp.query(data,condition.Variable)[0] != condition.StringGreaterThan

    }
    else if (_.has(condition,"TimestampGreaterThan")){
      return new Date(jp.query(data,condition.Variable)[0]) > condition.TimestampGreaterThan

    }
    else if (_.has(condition,"NumericGreaterThanEquals")){
      return jp.query(data,condition.Variable)[0] >=condition.NumericGreaterThanEquals

    }
    else if (_.has(condition,"StringGreaterThanEquals")){
      return jp.query(data,condition.Variable)[0].includes(condition.StringGreaterThanEquals)

    }
    else if (_.has(condition,"TimestampGreaterThanEquals")){
      return new Date(jp.query(data,condition.Variable)[0]) >= new Date(condition.TimestampGreaterThanEquals)


    }
    else if (_.has(condition,"NumericLessThan")){
      return jp.query(data,condition.Variable)[0] < condition.NumericLessThan


    }
    else if (_.has(condition,"StringLessThan")){
      return condition.StringLessThan.includes(jp.query(data,condition.Variable)[0]) && 
      condition.StringLessThan != jp.query(data,condition.Variable)[0]

    }
    else if (_.has(condition,"TimestampLessThan")){
      return new Date(jp.query(data,condition.Variable)[0]) < new Date(condition.TimestampLessThan)


    }
    else if (_.has(condition,"NumericLessThanEquals")){
      return jp.query(data,condition.Variable)[0] <= condition.NumericLessThanEquals


    }
    else if (_.has(condition,"StringLessThanEquals")){
      return condition.StringLessThanEquals.includes(jp.query(data,condition.Variable)[0])


    }
    else if (_.has(condition,"TimestampLessThanEquals")){
      return new Date(jp.query(data,condition.Variable)[0]) <= new Date(condition.TimestampLessThanEquals)

    }


    else if (_.has(condition,"NumericEqualsPath")){
      return jp.query(data,condition.Variable)[0] == jp.query(data,condition.NumericEqualsPath)[0]

    }
    else if (_.has(condition,"StringEqualsPath")){
      return jp.query(data,condition.Variable)[0] == jp.query(data,condition.StringEqualsPath)[0]
    }
    else if (_.has(condition,"TimestampEqualsPath")){
      return jp.query(data,condition.Variable)[0] == jp.query(data,condition.TimestampEqualsPath)[0]

    }
    else if (_.has(condition,"NumericGreaterThanPath")){
      return jp.query(data,condition.Variable)[0] > jp.query(data,condition.NumericGreaterThanPath)[0]


    }
    else if (_.has(condition,"StringGreaterThanPath")){
      return jp.query(data,condition.Variable)[0].includes(jp.query(data,condition.StringGreaterThanPath)[0]) &&
      jp.query(data,condition.Variable)[0] != jp.query(data,condition.StringGreaterThanPath)[0]

    }
    else if (_.has(condition,"TimestampGreaterThanPath")){
      return new Date(jp.query(data,condition.Variable)[0]) > new Date(jp.query(data,condition.TimestampGreaterThanPath)[0])

    }
    else if (_.has(condition,"NumericGreaterThanEqualsPath")){
      return jp.query(data,condition.Variable)[0] >= jp.query(data,condition.NumericGreaterThanEqualsPath)[0]


    }
    else if (_.has(condition,"StringGreaterThanEqualsPath")){
      return jp.query(data,condition.Variable)[0].includes(jp.query(data,condition.StringGreaterThanEqualsPath)[0])


    }
    else if (_.has(condition,"TimestampGreaterThanEqualsPath")){
      return new Date(jp.query(data,condition.Variable)[0]) >= new Date(jp.query(data,condition.TimestampGreaterThanEqualsPath)[0])


    }
    else if (_.has(condition,"NumericLessThanPath")){
      return jp.query(data,condition.Variable)[0] < jp.query(data,condition.NumericLessThanPath)[0]


    }
    else if (_.has(condition,"StringLessThanPath")){
      return jp.query(data,condition.StringLessThanPath)[0].includes(jp.query(data,condition.Variable)[0]) && 
      jp.query(data,condition.StringLessThanPath)[0] != jp.query(data,condition.Variable)[0]
    }
    else if (_.has(condition,"TimestampLessThanPath")){
      return new Date(jp.query(data,condition.Variable)[0]) < new Date(jp.query(data,condition.TimestampLessThanPath)[0])


    }
    else if (_.has(condition,"NumericLessThanEqualsPath")){
      return jp.query(data,condition.Variable)[0] <= jp.query(data,condition.NumericLessThanEqualsPath)[0]


    }
    else if (_.has(condition,"StringLessThanEqualsPath")){
      return jp.query(data,condition.StringLessThanEqualsPath)[0].includes(jp.query(data,condition.Variable)[0])

    }
    else if (_.has(condition,"TimestampLessThanEqualsPath")){
      return new Date(jp.query(data,condition.Variable)[0]) <= new Date(data,jp.query(data,condition.TimestampLessThanEqualsPath)[0])
    }
  };
}
