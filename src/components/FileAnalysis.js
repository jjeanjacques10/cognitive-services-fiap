//browser compatibility http://caniuse.com/#feat=stream

import React, { Component } from 'react';
import Webcam from 'react-webcam';
import Sidebar from 'react-sidebar';
import { Button, ButtonGroup } from 'reactstrap';
import Switch from 'react-switch';
import ImageUploader from 'react-images-upload';


export class FileAnalysis extends Component {
    static displayName = FileAnalysis.name;


    setRef = webcam => {
        this.webcam = webcam;
    };


    constructor(props) {
        super(props);
        this.state = {

            /* Set the subscription key here */
            subscriptionKey: '',
            /* For example, if your subscription key is ABCDE12345, the line should look like
             * subscriptionKey: 'ABCDE12345' , */
            endpointRegion: '', //change your endpoint region here

            facingMode: "user",
            img: null,
            fetchTime: null,
            objects: null,
            tags: null,
            caption: null,
            captureOn: false,
            captureDelay: 500,
            sidebarOpen: true,
        };
        this.makeblob = this.makeblob.bind(this);
        this.capture = this.capture.bind(this);
        this.updateCanvas = this.updateCanvas.bind(this);
        this.onSetSidebarOpen = this.onSetSidebarOpen.bind(this);
        this.handleFormInput = this.handleFormInput.bind(this);
        this.handleSwitchChange = this.handleSwitchChange.bind(this);

    }

    makeblob = function (dataURL) {
        var BASE64_MARKER = ';base64,';
        if (dataURL.indexOf(BASE64_MARKER) == -1) {
            var parts = dataURL.split(',');
            var contentType = parts[0].split(':')[1];
            var raw = decodeURIComponent(parts[1]);
            return new Blob([raw], { type: contentType });
        }
        var parts = dataURL.split(BASE64_MARKER);
        var contentType = parts[0].split(':')[1];
        var raw = window.atob(parts[1]);
        var rawLength = raw.length;
        var uInt8Array = new Uint8Array(rawLength);

        for (var i = 0; i < rawLength; ++i) {
            uInt8Array[i] = raw.charCodeAt(i);
        }

        return new Blob([uInt8Array], { type: contentType });
    }

    updateCanvas() {
        const ctx = this.canvas.getContext('2d');
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        var img = new Image;
        let objects = this.state.objects;

        img.onload = function () {
            ctx.drawImage(img, 0, 0, 680, 680);

            ctx.lineWidth = 4;
            ctx.lineJoin = 'bevel';
            const font = "16px sans-serif"
            ctx.font = font;
            ctx.textBaseline = "top";
            if (objects !== undefined) {
                objects.forEach(object => {
                    try {
                        console.log(object.confidence, object.object, object.rectangle);

                        ctx.strokeStyle = "rgba(255,0,0," + String((object.confidence - 0.4) * 2) + ")";
                        ctx.lineWidth = 4;
                        ctx.strokeRect(object.rectangle.x, object.rectangle.y, object.rectangle.w, object.rectangle.h);

                        ctx.fillStyle = "rgba(255,255,255," + String(object.confidence) + ")";;
                        const textWidth = ctx.measureText(object.object + " (" + object.confidence + ")").width;
                        const textHeight = parseInt(font, 10); // base 10
                        ctx.fillRect(object.rectangle.x, object.rectangle.y - (textHeight + 4), textWidth + 4, textHeight + 4);

                        ctx.fillStyle = "rgb(0,0,0)";
                        ctx.fillText(object.object + " (" + object.confidence + ")", object.rectangle.x, (object.rectangle.y - textHeight - 2));
                    } catch (error) {
                        console.log("Error");
                    }
                });
            }
        };

        img.src = this.state.img;
    }

    getBase64(file, cb) {
        let reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = function () {
            cb(reader.result)
        };
        reader.onerror = function (error) {
            console.log('Error: ', error);
        };
    }

    capture = function (picture) {
        let image = '';
        console.log(picture);
        this.getBase64(picture[picture.length - 1], (result) => {
            image = result;

            const imageBlob = this.makeblob(image);
            this.setState({ img: image });
            var t0 = performance.now();
            //Object Detection
            fetch('https://' + this.state.endpointRegion + '.api.cognitive.microsoft.com/vision/v2.0/analyze/?visualFeatures=Adult,Description', {
                method: 'POST',
                headers: {
                    'Ocp-Apim-Subscription-Key': this.state.subscriptionKey,
                    'Content-Type': 'application/octet-stream',
                },

                body: imageBlob,

            }).then(response => response.json())
                .then(data => {
                    var t1 = performance.now();
                    this.setState({ objects: data.objects, fetchTime: (t1 - t0).toFixed(3) });
                    this.setState({ adultScore: data.adult.adultScore });
                    this.setState({ isAdultContent: data.adult.isAdultContent });
                }).then(returnValue => this.updateCanvas());


            //Image description
            fetch('https://' + this.state.endpointRegion + '.api.cognitive.microsoft.com/vision/v2.0/describe/', {
                method: 'POST',
                headers: {
                    'Ocp-Apim-Subscription-Key': this.state.subscriptionKey,
                    'Content-Type': 'application/octet-stream',
                },

                body: imageBlob,

            }).then(response => response.json())
                .then(data => {
                    console.log(data.description);
                    if (data.description !== undefined) {
                        if (data.description.captions.length >= 1) {
                            this.setState({ caption: data.description.captions[0].text });
                            this.setState({ captionConfidence: data.description.captions[0].confidence.toFixed(3) });
                            this.setState({ tags: data.description.tags });
                        }
                    }
                });
        });
        picture = undefined;
    }

    StartCapture = async () => {
        this.setState({ captureOn: true });
        this.interval = setInterval(() => this.capture(), this.state.captureDelay);
    }

    StopCapture = () => {
        this.setState({ captureOn: false });
        clearInterval(this.interval);
    }

    onSetSidebarOpen(open) {
        this.setState({ sidebarOpen: open });
    }


    handleFormInput(event) {
        const target = event.target;
        const value = target.value;
        const name = target.name;
        this.setState({
            [name]: value
        });
    }

    handleSwitchChange(captureOn) {
        this.setState({ captureOn });
        if (captureOn) {
            this.interval = setInterval(() => this.capture(), this.state.captureDelay);
        }
        else {
            clearInterval(this.interval);
        }
    }


    render() {
        return (
            <Sidebar
                sidebar={
                    <div style={{ display: 'inline-block', marginLeft: '10%' }}>
                        <Button color="primary" size="lg" style={{ float: 'right', width: '100px' }} onClick={() => this.onSetSidebarOpen(false)}>
                            Fechar
                        </Button>

                        <br />
                        <h3>Configurações Azure</h3>
                        <form>
                            <br />
                            <label>
                                Endpoint region:
                                <input
                                    name="endpointRegion"
                                    type="text"
                                    value={this.state.endpointRegion}
                                    onChange={this.handleFormInput} />
                            </label>
                            <br /> <br />
                            <label>
                                API key:
                                <br />
                                <input
                                    name="subscriptionKey"
                                    type="password"
                                    value={this.state.subscriptionKey}
                                    onChange={this.handleFormInput} />
                            </label>
                            <br /> <br />
                            <label>
                                Frequência da análise em tempo real (ms): <br />
                                <input style={{ width: '50px' }}
                                    name="captureDelay"
                                    type="number"
                                    value={this.state.captureDelay}
                                    onChange={this.handleFormInput} />
                            </label>

                        </form>

                    </div>
                }
                open={this.state.sidebarOpen}
                onSetOpen={this.onSetSidebarOpen}
                styles={{ sidebar: { background: "white", width: '300px' } }}
                pullRight={true}
            >



                <Button color="primary" size="lg" style={{ float: 'right', width: '100px' }} onClick={() => this.onSetSidebarOpen(true)}>
                    Settings
                </Button>

                <div style={{ display: 'inline-block', marginLeft: '10%' }}>
                    <h3>FIAP - Cognitive Services</h3>
                    <h5>Upload de Imagens</h5>
                    <br />

                    <table>
                        <tbody>
                            <tr>
                                <td style={{ width: '500px' }}>
                                    <center>
                                        <td >
                                            <center>
                                                {this.state.subscriptionKey ? null : <p> Defina a chave de assinatura para iniciar</p>}

                                                <br />
                                                {this.state.subscriptionKey ?
                                                    [this.state.captureOn ?
                                                        <div key="captureOn">

                                                        </div> :
                                                        <div key="captureOff">
                                                            <ImageUploader
                                                                withIcon={true}
                                                                buttonText='Selecione uma imagem'
                                                                onChange={this.capture}
                                                                imgExtension={['.jpg', '.gif', '.png', '.gif']}
                                                                maxFileSize={5242880}
                                                            />
                                                        </div>]
                                                    : null}

                                            </center>
                                        </td>
                                    </center>
                                </td>

                                <td style={{ width: '680px' }}>
                                    <canvas ref={(canvas) => this.canvas = canvas} width="680" height="680" />
                                </td>

                            </tr>
                            <tr style={{ verticalAlign: 'top' }}>

                                <td>

                                </td>
                                <td>
                                    {this.state.caption ? <div> <h3>Caption </h3> <p> {this.state.caption} ({this.state.captionConfidence}) </p> </div> : null}
                                    {this.state.tags ?
                                        <div> <h3> Tags </h3> <ul>
                                            {this.state.tags.map(function (tag, index) {
                                                return <li key={index}>{tag}</li>;
                                            })}
                                        </ul>
                                        </div> : null
                                    }
                                    {this.state.isAdultContent !== undefined ? <div> <p> <b>É material imprório: </b>  {this.state.isAdultContent.toString()} </p><b /> </div> : null}
                                    {this.state.adultScore ? <div> <p> <b>Score Conteúdo adulto: </b>  {this.state.adultScore}</p> </div> : null}
                                    {this.state.fetchTime ? <div> <p> <b>Latency: </b>  {this.state.fetchTime} milliseconds</p> </div> : null}

                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

            </Sidebar>
        );
    }
}
