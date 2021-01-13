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

    let buttonLabel = "Verify";

    const verify = (button) => {

        $('#found-notice').hide();
        $('#not-found-notice').hide();

        const stage = $('input[name=stage]:checked').val();
        const hashType = $('input[name=hash-type]:checked').val();
        const verificationType = $('input[name=verification]:checked').val();

        let verificationPath;
        if (verificationType === "full") {
            verificationPath = veriPaths.full
        } else if (verificationType === "upper") {
            verificationPath = veriPaths.upper
        } else if (verificationType === "initial") {
            verificationPath = veriPaths.initial
        } else if (verificationType === "simple") {
            verificationPath = veriPaths.simple
        } else {
            verificationPath = veriPaths.upper
        }

        const postData = $('#sha' + hashType + '-output').text().trim();
        if (postData === "") {
            $('#not-found-notice').show().text("Please: Enter some data");
            return false;
        }

        button.html("Verifying")
        button.prop("disabled", true);

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
            $('#found-details').html("")

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
                    if (verificationType === "full") {
                        const uppers = dataJ.anchors.upper_blockchains
                        $('#found-details').append("U: " + uppers.length)
                        uppers.forEach((e) => {
                            $('#tree-output ul').append(
                                '<li class="list-group-item"> &uarr; - ' + e.properties.public_chain + '<br>' + e.properties.hash + '<br>' + e.properties.timestamp + '</li>');
                        });
                        const lowers = dataJ.anchors.lower_blockchains
                        $('#found-details').append(" | L: " + uppers.length)
                        lowers.forEach((e) => {
                            $('#tree-output ul').append(
                                '<li class="list-group-item"> &darr; - ' + e.properties.public_chain + '<br>' + e.properties.hash + '<br>' + e.properties.timestamp + '</li>');
                        });
                    } else if (verificationType === "upper") {
                        const uppers = dataJ.anchors
                        $('#found-details').append("U: " + uppers.length)
                        uppers.forEach((e) => {
                            $('#tree-output ul').append(
                                '<li class="list-group-item"> &uarr; -' + e.properties.public_chain + '<br>' + e.properties.hash + '<br>' + e.properties.timestamp + '</li>');
                        });
                    } else {
                        // do nothing
                    }
                }
                button.html(buttonLabel)
                button.prop("disabled", false);
            });
            response.on('data', (chunk) => {
                data += chunk;
            });
        });
        request.write(postData);
        request.end();
    };

    let schedulerId = null;
    let counterId = null;
    const onClick = (event) => {
        const scheduler = $('input[name=scheduler]').is(':checked')
        let counter = 1;
        if (scheduler === true && schedulerId === null) {
            buttonLabel = "Stop Scheduler"
            $(event.currentTarget).html(buttonLabel)
            counterId = setInterval(() => {
                $(event.currentTarget).html(buttonLabel + '-' + counter)
                counter = counter + 1;
                if(counter === 30){
                  counter = 1;
                }
            }, 1000);
            schedulerId = setInterval(() => {
                verify($(event.currentTarget))
            }, 30000)
        } else {
            buttonLabel = "Verify"
            $(event.currentTarget).html(buttonLabel)
            clearInterval(schedulerId);
            clearInterval(counterId)
            schedulerId = null
            verify($(event.currentTarget))
        }
    }

    $('#text-input').bind('input propertychange', (event) => {
        const text = event.currentTarget.value
        const sha256 = crypto.createHash('sha256').update(text, 'utf8').digest('base64')
        $('#sha256-output').text(sha256)
        const sha512 = crypto.createHash('sha512').update(text, 'utf8').digest('base64')
        $('#sha512-output').text(sha512)
    })

    $('#verify').click(onClick);

    $('#text-input').focus() // focus input box
})
