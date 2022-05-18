import Aws from "aws-sdk"

class CovidRepository {
  constructor() {
    this.dbClient = new Aws.DynamoDB.DocumentClient({
      region: 'us-east-1',
      endpoint: 'http://localhost:8000',
    })
  }

  async saveRows(payload) {
    const rows = payload.map(res => ({
      PutRequest: {
        Item: {
          id: res.id,
          date: res.date,
          state: res.state,
          report: res.report
        }
      } 
    }))
    const params = {
      RequestItems: {
        ['covid-dataset']: rows
      }
    }
    const response = await this.dbClient.batchWrite(params).promise()
    return response.$response.requestId;
  }
}

export const covidRepository = new CovidRepository()