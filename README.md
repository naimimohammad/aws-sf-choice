##### For using aws stepfunction choice json pattern 

`aws-sf-choice` is json-condition pattern as aws asl pattern 
## aws stepfunction choice document: 
https://docs.aws.amazon.com/step-functions/latest/dg/amazon-states-language-choice-state.html
## Features
The following comparison operators are supported:

- And
- BooleanEquals,BooleanEqualsPath
- IsBoolean
- IsNull
- IsNumeric
- IsPresent
- IsString
- IsTimestamp
- Not
- NumericEquals,NumericEqualsPath
- NumericGreaterThan,NumericGreaterThanPath
- NumericGreaterThanEquals,NumericGreaterThanEqualsPath
- NumericLessThan,NumericLessThanPath
- NumericLessThanEquals,NumericLessThanEqualsPath
- Or
- StringEquals,StringEqualsPath
- StringGreaterThan,StringGreaterThanPath
- StringGreaterThanEquals,StringGreaterThanEqualsPath
- StringLessThan,StringLessThanPath
- StringLessThanEquals,StringLessThanEqualsPath
- TimestampEquals,TimestampEqualsPath
- TimestampGreaterThan,TimestampGreaterThanPath
- TimestampGreaterThanEquals,TimestampGreaterThanEqualsPath
- TimestampLessThan,TimestampLessThanPath
- TimestampLessThanEquals,TimestampLessThanEqualsPath



## Install 
```
npm install aws-sf-choice
```
## Useage

```javascript
import {Choice } from 'aws-sf-choice'

let sampleCondition = {
 Type: "Choice",
    Choices: [
      {
        Variable: "$.r",
        IsPresent: true,
        Next: "nextState1"
      },
      { 
        Not:{
          Variable: "$.r",
          IsTimestamp: true,
        },
        Next: "nextState2",
      }
    ],
    Default: "DefaultState"
}

let sampleData = {
    r : "this is sample text",
    rr : 2
}

let choice = new Choice(sampleCondition,sampleData) // fist is condition , second is data
choice.start()
    .then(r=>{
        console.log("next state is : ",r)
    })


```

`start()` method is promise function you could get next state by `await` 



