'use strict';

import * as cbor from "cbor-x";
import * as msgpackr from 'msgpackr';

import { bench, Benchmark, BenchSuite } from "../../src/ts/bench";
// import 'crypto'
// import { randomBytes } from "crypto";

export async function main() {
    // '"\x00\x00\x00\xf1b\\\xbf\xff\xff\xff\xff\x04\x00m\xea\x06\x14m\xf7\xd1\x0bk\x1e"\x0fn\xdc\xa32\xcc\x03\x81\x1e\xad+\x00\x02VhA?\x1b\xbf\x17\x17'
    // '\x16\x00\x00\x00q\xcf\xc6*\x00\x00\x00\x00\n\x00\xdaR\xd7\xc2\xab\xdf\x8a\x0776\xfa\x9adT?\x14\x88a(v'
    // '"\x00\x00\x00\xf1b\\\xbf\xff\xff\xff\xff\x04\x00m\xea\x06\x14m\xf7\xd1\x0bk\'
    // bench("text encoder 1", () => {
    //     stringToByteArray('\x16\x00\x00\x00q\xcf\xc6*\x00\x00\x00\x00\n\x00\xdaR\xd7\xc2\xab\xdf\x8a\x0776\xfa\x9adT?\x14\x88a(v')
    // })

    // bench("text decoder 1", () => {
    //     byteArrayToString(aaa)
    // })
    // bench("stringToByteArray 2", () => {
    //     stringToByteArray('"\x00\x00\x00\xf1b\\\xbf\xff\xff\xff\xff\x04\x00m\xea\x06\x14m\xf7\xd1\x0bk\x1e"\x0fn\xdc\xa32\xcc\x03\x81\x1e\xad+\x00\x02VhA?\x1b\xbf\x17\x17')
    // }, iterations * 10)

    // bench("text encoder 2", () => {
    //     new TextEncoder().encode('"\x00\x00\x00\xf1b\\\xbf\xff\xff\xff\xff\x04\x00m\xea\x06\x14m\xf7\xd1\x0bk\x1e"\x0fn\xdc\xa32\xcc\x03\x81\x1e\xad+\x00\x02VhA?\x1b\xbf\x17\x17')
    // }, iterations)

    // let x = "123";
    // let x = new Array(n).fill(7);
    // let x = { test1ffffffffffffffffffff: 3, test2: 4, tesdf: 8 };
    // let x = { a: 3, b: 4, c: 8 };
    // let z = '"\x00\x00\x00\xf1b\\\xbf\xff\xff\xff\xff\x04\x00m\xea\x06\x14m\xf7\xd1\x0bk\x1e"\x0fn\xdc\xa32\xcc\x03\x81\x1e\xad+\x00\x02VhA?\x1b\xbf\x17\x17'
    // let x = stringToByteArray(z)
    // let zz = new Uint32Array([1, 2, 3, 4, 5, 6, 7, 8])
    // let x = [34, 0, 0, 0, 241, 98, 92, 191, 255, 255, 255, 255, 4, 0, 109, 234, 6, 20, 109, 247, 209, 11, 107, 30, 34, 15, 110, 220, 163, 50, 204, 3, 129, 30, 173, 43, 0, 2, 86, 104, 65, 63, 27, 191, 23, 23]
    // let x = new Uint8Array([34, 0, 0, 0, 241, 98, 92, 191, 255, 255, 255, 255, 4, 0, 109, 234, 6, 20, 109, 247, 209, 11, 107, 30, 34, 15, 110, 220, 163, 50, 204, 3, 129, 30, 173, 43, 0, 2, 86, 104, 65, 63, 27, 191, 23, 23])
    // let x = { a: 1000, b: true, c: { d: { e: { f: 1000 } } }, z: new Uint8Array([34, 0, 0, 0, 241, 98, 92, 191, 255, 255, 255, 255, 4, 0, 109, 234, 6, 20, 109, 247, 209, 11, 107, 30, 34, 15, 110, 220, 163, 50, 204, 3, 129, 30, 173, 43, 0, 2, 86, 104, 65, 63, 27, 191, 23, 23]) }
    // let x = { var1a: 4294967295, var1ab: true, var1ac: { var1ad: { var1ae: { var1af: 4294967295 } } } }
    // let x = true
    // let x = "lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor."

    // let x = 4294967295;
    // let x = 10000;
    // let x = { a: 1, b: 2, c: { d: { e: 3 } } };

    // demos(() => crypto.getRandomValues(x))
    // demos(() => crypto.getRandomValues(new Uint8Array(100)))
    await benchAllSerializers(() => { return { a: 1000, b: true, c: { d: { e: { f: 1000 } } }, z: new Uint8Array([34, 0, 0, 0, 241, 98, 92, 191, 255, 255, 255, 255, 4, 0, 109, 234, 6, 20, 109, 247, 209, 11, 107, 30, 34, 15, 110, 220, 163, 50, 204, 3, 129, 30, 173, 43, 0, 2, 86, 104, 65, 63, 27, 191, 23, 23]) } })
    // demos(() => { return { a: 1, b: 2, c: { d: { e: 3 } } } })
}

export class SerializerBench<T, K extends (Uint8Array | string)> extends BenchSuite {
    encode: ((data: any) => K)
    decode: ((bytes: K) => any)
    data: T
    encodedData: K

    constructor(data: T, encode: ((data: any) => K), decode: ((bytes: K) => any)) {
        super()
        this.encode = encode
        this.decode = decode
        this.data = data
        this.encodedData = encode(data)
    }

    async encoding() {
        return this.encode(this.data)
    }

    async decoding() {
        return this.decode(this.encodedData)
    }
}

export const benchAllSerializers = async <T>(makeValue: () => T) => {
    let cborEncoder = new cbor.Encoder()
    let msgpackEncoder = new msgpackr.Encoder()
    let cborStructuredCloneEncoder = new cbor.Encoder({ structuredClone: true })
    let msgpackStructuredCloneEncoder = new msgpackr.Encoder({ structuredClone: true })
    let cborStructuredCloneRecordEncoder = new cbor.Encoder({ structuredClone: true, useRecords: true })
    let msgpackStructuredCloneRecordEncoder = new msgpackr.Encoder({ structuredClone: true, useRecords: true })
    let cborStructuredCloneStructuresEncoder = new cbor.Encoder({ structuredClone: true, structures: [] })
    let cborStructuredCloneRecordStructuresEncoder = new cbor.Encoder({ structuredClone: true, structures: [], useRecords: true })
    let cborRecordStructuresEncoder = new cbor.Encoder({ structures: [], useRecords: true })
    let msgpackStructuredCloneStructuresEncoder = new msgpackr.Encoder({ structuredClone: true, structures: [] })
    let msgpackStructuredCloneRecordStructuresEncoder = new msgpackr.Encoder({ structuredClone: true, structures: [], useRecords: true })
    let msgpackRecordStructuresEncoder = new msgpackr.Encoder({ structures: [], useRecords: true })

    let values: T[] = new Array<T>()

    await new SerializerBench(makeValue(), JSON.stringify, JSON.parse).run({ name: "JSON" })
    await new SerializerBench(makeValue(), cborEncoder.encode.bind(cborEncoder), cborEncoder.decode.bind(cborEncoder)).run({ name: "CBOR" })
    await new SerializerBench(makeValue(), msgpackEncoder.encode.bind(msgpackEncoder), msgpackEncoder.decode.bind(msgpackEncoder)).run({ name: "MSGPack" })

    // console.log(await bench(x.encoding, { this: x }))
    // console.log(await bench(x.encoding.bind(x)))

    // await benchSerializer("JSON", values, makeValue, JSON.stringify, JSON.parse)

    // await benchSerializer("CBOR", values, makeValue, cborEncoder.encode.bind(cborEncoder), cborEncoder.decode.bind(cborEncoder))

    // await benchSerializer("CBOR - structured clone", values, makeValue, cborStructuredCloneEncoder.encode.bind(cborStructuredCloneEncoder), cborStructuredCloneEncoder.decode.bind(cborStructuredCloneEncoder))

    // // benchSerializer("CBOR - structured clone + record", values, makeValue, cborStructuredCloneRecordEncoder.encode.bind(cborStructuredCloneRecordEncoder), cborStructuredCloneRecordEncoder.decode.bind(cborStructuredCloneRecordEncoder))

    // // benchSerializer("CBOR - structured clone + structures", values, makeValue, cborStructuredCloneStructuresEncoder.encode.bind(cborStructuredCloneStructuresEncoder), cborStructuredCloneStructuresEncoder.decode.bind(cborStructuredCloneStructuresEncoder))

    // benchSerializer("CBOR - structured clone + record + structures", values, makeValue, cborStructuredCloneRecordStructuresEncoder.encode.bind(cborStructuredCloneRecordStructuresEncoder), cborStructuredCloneRecordStructuresEncoder.decode.bind(cborStructuredCloneRecordStructuresEncoder))
    // benchSerializer("CBOR - record + structures", values, makeValue, cborRecordStructuresEncoder.encode.bind(cborRecordStructuresEncoder), cborRecordStructuresEncoder.decode.bind(cborRecordStructuresEncoder))

    // // benchSerializer("MSGPack", values, makeValue, msgpackEncoder.encode.bind(msgpackEncoder), msgpackEncoder.decode.bind(msgpackEncoder))

    // benchSerializer("MSGPack - structured clone", values, makeValue, msgpackStructuredCloneEncoder.encode.bind(msgpackStructuredCloneEncoder), msgpackStructuredCloneEncoder.decode.bind(msgpackStructuredCloneEncoder))

    // // benchSerializer("MSGPack - structured clone + record", values, makeValue, msgpackStructuredCloneRecordEncoder.encode.bind(msgpackStructuredCloneRecordEncoder), msgpackStructuredCloneRecordEncoder.decode.bind(msgpackStructuredCloneRecordEncoder))

    // // benchSerializer("MSGPack - structured clone + structures", values, makeValue, msgpackStructuredCloneStructuresEncoder.encode.bind(msgpackStructuredCloneStructuresEncoder), msgpackStructuredCloneStructuresEncoder.decode.bind(msgpackStructuredCloneStructuresEncoder))
    // benchSerializer("MSGPack - structured clone + record + structures", values, makeValue, msgpackStructuredCloneRecordStructuresEncoder.encode.bind(msgpackStructuredCloneRecordStructuresEncoder), msgpackStructuredCloneRecordStructuresEncoder.decode.bind(msgpackStructuredCloneRecordStructuresEncoder))
    // benchSerializer("MSGPack - record + structures", values, makeValue, msgpackRecordStructuresEncoder.encode.bind(msgpackRecordStructuresEncoder), msgpackRecordStructuresEncoder.decode.bind(msgpackRecordStructuresEncoder))
    // benchSerializer("BSON", x, BSON.serialize, BSON.deserialize)
    // benchSerializer("EJSON", x, toBytesFn(EJSON.stringify), EJSON.deserialize)
}

let benchSerializer = async <T, K extends (Uint8Array | string)>(name: string, values: T[], makeValue: () => T, encode: ((data: any) => K), decode: ((bytes: K) => any)) => {
    try {
        let data = makeValue();
        let encodedData = encode(data);
        let decodedData = decode(encodedData);

        var encodedDataString: string;
        var encodedDataBytes: Uint8Array;

        switch (encodedData.constructor) {
            case Uint8Array:
                encodedDataBytes = encodedData as Uint8Array
                encodedDataString = byteArrayToString(encodedDataBytes)
                break;
            case String:
                encodedDataString = encodedData as string
                encodedDataBytes = stringToByteArray(encodedDataString)
                break;
        }

        let encodedValues: K[] = [];

        await bench((B) => {
            // B.StopTimer()
            // makeValue();
            // B.StartTimer()
            encode(data);
        }, { name: `${name} - encode fixed` })

        // await bench((B) => {
        //     // B.StopTimer()
        //     // encode(makeValue());
        //     // B.StartTimer()

        //     decode(encodedData);
        // }, { name: `${name} - decode fixed` })

        // await bench((B) => {
        //     B.StopTimer()
        //     let data = makeValue();
        //     B.StartTimer()

        //     encode(data);
        // }, {
        //     name: `${name} - encode unique`,
        //     setupFn: (B) => {
        //         // if (!values[B.I]) {
        //         //     values[B.I] = makeValue()
        //         // }
        //     }
        // },)


        // await bench((B) => {
        //     B.StopTimer()
        //     let data = encode(makeValue());
        //     B.StartTimer()

        //     decode(data);
        // }, {
        //     name: `${name} - decode unique`,
        //     setupFn: (B) => {
        //         // if (!values[B.I]) {
        //         //     values[B.I] = makeValue()
        //         // }

        //         // if (!encodedValues[B.I]) {
        //         //     encodedValues[B.I] = encode(values[B.I])
        //         //     decode(encodedValues[B.I])
        //         // }
        //     }
        // })

        // console.log(`${res.name}\t${res.N.toLocaleString()} iterations\t${Math.round(1000 * res.N / res.duration).toLocaleString()} ops/sec`)

    } catch (error) {
        console.error(error)
    }
}

function table(...benches: Benchmark[]) {
    console.table(benches.map(b => {
        return {
            name: b.name,
            "ops/sec": Math.round(1000 * b.N / b.duration).toLocaleString(),
        }
    }))
}


function toBytesFn(fn: (data: any) => string) {
    // return (data: any) => new TextEncoder().encode(fn(data))
    return (data: any) => stringToByteArray(fn(data))
}

function fromBytesFn(fn: (data: string) => any) {
    // return (bytes: Uint8Array) => fn(new TextDecoder().decode(bytes))
    return (bytes: Uint8Array) => fn(byteArrayToString(bytes))
}

function stringToByteArray(str: string) {
    const byteArray = new Uint8Array(str.length);

    for (let i = 0; i < str.length; i++) {
        byteArray[i] = str.charCodeAt(i);
    }

    return byteArray;
}

function byteArrayToString(bytes: Uint8Array) {
    return String.fromCharCode(...bytes)
}

// function stringToByteArray2(str: string) {
//     return new TextEncoder().encode(str)
// }

// let textEncoder = new TextEncoder()
// function stringToByteArray3(str: string) {
//     return textEncoder.encode(str)
// }


// function byteArrayToString2(bytes: Uint8Array) {
//     return new TextDecoder().decode(bytes)
// }


// let textDecoder = new TextDecoder()
// function byteArrayToString3(bytes: Uint8Array) {
//     return textDecoder.decode(bytes)
// }

