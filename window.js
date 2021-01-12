$(() => {
    const crypto = require('crypto')
    const electron = require('electron')
    const net = electron.remote.net;

    const veriPaths = {
        full: '/api/upp/verify/record',
        upper: '/api/upp/verify/anchor',
        initial: '/api/upp/verify',
        simple: '/api/upp/verify'
    }

    const verify = (event) => {

        const stage = $('input[name=stage]:checked').val();
        const hashType = $('input[name=hash-type]:checked').val();
        const verificationType = $('input[name=verification]:checked').val();

        let verificationPath;
        if(verificationType === "full"){
            verificationPath=veriPaths.full
        } else if (verificationType === "upper"){
            verificationPath=veriPaths.upper
        } else if (verificationType === "initial"){
            verificationPath=veriPaths.initial
        } else if (verificationType === "simple"){
            verificationPath=veriPaths.simple
        } else {
            verificationPath=veriPaths.upper
        }

        const postData = $('#sha' + hashType + '-output').text().trim();
        if (postData === "") {
            $('#not-found-notice').show().text("Please: Enter some data");
            return false;
        }

        const button = $(event.currentTarget)
        button.html("Verifying")
        button.prop("disabled",true);

        const request = net.request({
            method: 'POST',
            protocol: 'https:',
            hostname: 'verify.' + stage + '.ubirch.com',
            path: verificationPath,
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
                if (data.length > 0) {
                    const dataJ = JSON.parse(data);
                    if(verificationType === "full"){
                        dataJ.anchors.upper_blockchains.forEach((e) => {
                            $('#tree-output ul').append(
                                '<li class="list-group-item"> &uarr; - ' + e.properties.public_chain + '<br>' + e.properties.hash + '<br>' + e.properties.timestamp + '</li>');
                        });
                        dataJ.anchors.lower_blockchains.forEach((e) => {
                            $('#tree-output ul').append(
                                '<li class="list-group-item"> &darr; - ' + e.properties.public_chain + '<br>' + e.properties.hash + '<br>' + e.properties.timestamp + '</li>');
                        });
                    } else {
                        dataJ.anchors.forEach((e) => {
                            $('#tree-output ul').append(
                                '<li class="list-group-item">' + e.properties.public_chain + '<br>' + e.properties.hash + '<br>' + e.properties.timestamp + '</li>');
                        });
                    }

                }
                button.html("Verify")
                button.prop("disabled",false);
            });
            response.on('data', (chunk) => {
                data += chunk;
            });
        });
        request.write(postData);
        request.end();
    }

    $('#text-input').bind('input propertychange', (event) => {
        const text = event.currentTarget.value
        const sha256 = crypto.createHash('sha256').update(text, 'utf8').digest('base64')
        $('#sha256-output').text(sha256)
        const sha512 = crypto.createHash('sha512').update(text, 'utf8').digest('base64')
        $('#sha512-output').text(sha512)
    })

    $('#verify').click(verify);

    $('#text-input').focus() // focus input box
})
