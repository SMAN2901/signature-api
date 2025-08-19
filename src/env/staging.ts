const staging = {
  baseUrl: "https://app.selisestage.com",
  tokenApi: "api/identity/v25/identity/token",
  getUploadUrlApi: "api/storageservice/v23/StorageService/StorageQuery/GetPreSignedUrlForUpload",
  pollUploadStatusApi: "api/storageservice/v23/StorageService/StorageQuery/PollUploadStatus",
  prepareContractApi: "api/signature/v1/Contract/Prepare",
  prepareAndSendContractApi: "api/signature/v1/Contract/PrepareAndSend",
  sendContractApi: "api/signature/v1/Contract/Send",
  pollProcessApi: "api/signature/v1/Contract/PollProcess",
};

export default staging;
