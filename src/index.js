import { createReadStream, createWriteStream } from 'fs'
import { pipeline } from 'stream/promises'
import { parse } from 'csv-parse';
import { v4 } from 'uuid'
import { covidRepository } from "./covid-repository.js"

const FILE_PATH = './tmp/boletim.csv'
const file = createReadStream(FILE_PATH)

const csvParser = parse({
  delimiter: ',',
  relax_column_count: true,
  relax_quotes: true,
});

const cutArrayInEqualParts = ({ payload, maxParts }) => {
  return payload.reduce((acumulador, item, indice) => {
    const group = Math.floor(indice / maxParts)
    acumulador[group] = [...(acumulador[group] || []), item]
    return acumulador
  }, [])
}


async function* transformStream(chunks) {
  for await (const chunk of chunks) {
    const [date, _, state, report] = chunk
    yield { id: v4(), date, state, report }
  }
}

async function* transformArray(chunks) {
  const rows = []
  for await (const chunk of chunks) {
    rows.push(chunk)
  }
  yield cutArrayInEqualParts({ payload: rows, maxParts: 10 })
}


async function* write(chunks) {
  for await (const chunk of chunks) {
    for await (const row of chunk){
      yield `${(await covidRepository.saveRows(row))}\n`
    }
  }
}


await pipeline(
  file,
  csvParser,
  transformStream,
  transformArray,
  write,
  createWriteStream('./tmp/log.txt')
)
