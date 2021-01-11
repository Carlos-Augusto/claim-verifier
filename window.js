$(() => {
    const crypto = require('crypto')
    const electron = require('electron')
    const net = electron.remote.net;

    $('#text-input').bind('input propertychange', function () {
        const text = this.value
        const sha256 = crypto.createHash('sha256').update(text, 'utf8').digest('base64')
        $('#sha256-output').text(sha256)

        const sha512 = crypto.createHash('sha512').update(text, 'utf8').digest('base64')
        $('#sha512-output').text(sha512)
    })

    $('#verify').click(function () {

        const stage = $('input[name=stage]:checked').val();
        const hashType = $('input[name=hash-type]:checked').val();

        const postData = $('#sha' + hashType + '-output').text().trim();
        if (postData === "") {
            $('#not-found-notice').show().text("Please: Enter some data");
            return false;
        }

        const request = net.request({
            method: 'POST',
            protocol: 'https:',
            hostname: 'verify.' + stage + '.ubirch.com',
            path: '/api/upp/verify/anchor',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': postData.length
            }
        })
        request.on('response', (response) => {
            $('#found-notice').hide()
            $('#not-found-notice').hide()
            $('#tree-output ul').html("")

            if (response.statusCode > 299) {
                $('#not-found-notice').show();
            } else {
                $('#found-notice').show();
            }
            console.log(`STATUS: ${response.statusCode}`);
            console.log(`HEADERS: ${JSON.stringify(response.headers)}`);
            let data = '';
            response.on('end', () => {
                if(data.length > 0) {
                    const dataJ = JSON.parse(data);
                    dataJ.anchors.forEach((e) => {
                        $('#tree-output ul').append(
                            '<li class="list-group-item">' + e.properties.public_chain + '<br>' + e.properties.hash + '<br>' + e.properties.timestamp + '</li>');
                    });
                }
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
