function gerarQRCode() {
    const input = document.getElementById("qrInput").value;
    const qrCodeImg = document.getElementById("qrCode");
    const data = encodeURIComponent(input.trim()).toUpperCase();
    const groupSeparator1 = '0' //for some reason, this is necessary at the beginning
    const groupSeparator2 = '%1D' //this replaces the special character "GS" (\x1D) in the QR Code
    const additionalData = `${groupSeparator1}0106958590310112112511171727031610QF25K065${groupSeparator2}21`;
    if (input.length === 10) {
        qrCodeImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${additionalData}${data}`;
        qrCodeImg.alt = "QR Code gerado com o texto fornecido";
    } else {
        qrCodeImg.src = "";
        qrCodeImg.alt = "QR Code será exibido aqui";
    }
}