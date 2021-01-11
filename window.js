$(() => {
    const crypto = require('crypto')
    const electron = require('electron')
    const net = electron.remote.net;

    $('#text-input').bind('input propertychange', function () {
        const text = this.value

        const md5 = crypto.createHash('md5').update(text, 'utf8').digest('hex')
        $('#md5-output').text(md5)

        const sha1 = crypto.createHash('sha1').update(text, 'utf8').digest('hex')
        $('#sha1-output').text(sha1)

        const sha256 = crypto.createHash('sha256').update(text, 'utf8').digest('base64')
        $('#sha256-output').text(sha256)

        const sha512 = crypto.createHash('sha512').update(text, 'utf8').digest('base64')
        $('#sha512-output').text(sha512)
    })

    $('#verify-sha-256').click(function () {
        alert("Handler for .click() called.");
    });

    $('#verify-sha-512').click(function () {

        const postData = $('#sha512-output').text().trim();

        if (postData === "") {
            $('#sha512-not-found').show().text("Please: Enter some data");
            return false;
        }

        const request = net.request({
            method: 'POST',
            protocol: 'https:',
            hostname: 'verify.dev.ubirch.com',
            path: '/api/upp/verify/anchor',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': postData.length
            }
        })
        request.on('response', (response) => {
            $('#sha512-found').hide()
            $('#sha512-not-found').hide()
            $('#sha512-tree-output ul').html("")

            if (response.statusCode > 299) {
                $('#sha512-not-found').show()
            } else {
                $('#sha512-found').show()
            }
            console.log(`STATUS: ${response.statusCode}`)
            console.log(`HEADERS: ${JSON.stringify(response.headers)}`)
            let data = '';
            response.on('end', () => {
                const dataJ = JSON.parse(data);
                dataJ.anchors.forEach((e) => {
                    $('#sha512-tree-output ul').append(
                        '<li class="list-group-item">' + e.properties.public_chain + '<br>' + e.properties.hash + '<br>' + e.properties.timestamp + '</li>');
                });
            });
            response.on('data', (chunk) => {
                data += chunk;
            });
        });
        request.write(postData);
        request.end();
    });

    $('#text-input').focus() // focus input box
})
