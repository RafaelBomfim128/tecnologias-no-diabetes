function gerarQRCode() {
    const input1 = document.getElementById("qrInput1").value;
    const input2 = document.getElementById("qrInput2").value;
    const qrCodeImg = document.getElementById("qrCode");
    const data1 = encodeURIComponent(input1.trim()).toUpperCase();
    const data2 = encodeURIComponent(input2.trim()).toUpperCase();
    const groupSeparator = '0' //this replaces the special character "GS" (\x1D) in the QR Code
    const additionalData = `${groupSeparator}0106972831641803112412201130122010LT8J381085F${groupSeparator}`;
    if (input1.length === 2 && input2.length === 18) {
        qrCodeImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${additionalData}${data1}${data2}`;
        qrCodeImg.alt = "QR Code gerado com o texto fornecido";
    } else {
        qrCodeImg.src = "";
        qrCodeImg.alt = "QR Code será exibido aqui";
    }
}