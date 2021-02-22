const axios = require('axios');
const cheerio = require('cheerio');
const _ = require('lodash')
const EBook = require("omnia-ebook-generator");

const processArrUrl = async (arrUrl) => {
    console.log(`số chương: ${arrUrl.length}`)
    const arrUrlSliced = _.chunk(arrUrl, 300)
    const ebookChapters = []
    for (let index = 0; index < arrUrlSliced.length; index++) {
        const element = arrUrlSliced[index];
        const arrPromise = element.map(e => axios.get(e))
        const result = await Promise.all(arrPromise)
        result.map((eachChap) => {
            const chap = cheerio.load(eachChap.data)
            const title = chap('.container > h1').text()
            const content = chap('.container > .txt').text()
            const chapter = {
                title,
                data: content
            }
            ebookChapters.push(chapter)
        })
        console.log(`${index * 300 + 1} - ${((index + 1) * 300)} done`)
    }
    return ebookChapters
}

const generateEbook = (mEbook, name, fileName) => {
    const ebook = new EBook({
        title: name,
        lang: "vn"
    }, mEbook);

    const mFileName = `${fileName}.epub`
    ebook.render();
    ebook.save(mFileName);
}

const fetching = async (url, fileName) => {
    try {
        const response = await axios.get(url)
        const html = response.data
        const $ = cheerio.load(html);
        const chuongs = $('.chuongs>a')
        const author = $('.container>h2').text()
        const name = $('.container>h1').text()
        console.log(`Tìm thấy thông tin truyện`)
        console.log(`Tên truyện: ${name}`)
        console.log(`Tác giả: ${author}`)
        const urls = []
        chuongs.each((index, el) => {
            urls.push('https://m.truyencuatui.vn' + $(el).attr('href'))
        })
        const ebook = await processArrUrl(urls)
        generateEbook(ebook, name, fileName ? fileName : name.trim())

    } catch (error) {
        console.log({ error });
    }
}
module.exports = {
    fetching
}