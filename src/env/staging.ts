const staging = {
  baseUrl: "https://app.selisestage.com",
  tokenApi: "api/identity/v25/identity/token",
  getUploadUrlApi: "api/storageservice/v23/StorageService/StorageQuery/GetPreSignedUrlForUpload",
  pollUploadStatusApi: "api/storageservice/v23/StorageService/StorageQuery/PollUploadStatus",
  prepareContractApi: "api/selisign/v65/SeliSign//ExternalApp/PrepareContract",
  prepareAndSendContractApi: "api/selisign/v65/SeliSign//ExternalApp/PrepareAndSendContract",
  sendContractApi: "api/selisign/v65/SeliSign//ExternalApp/RolloutContract",
  pollProcessApi: "api/signature/v1/Contract/PollProcess",
};

export default staging;
