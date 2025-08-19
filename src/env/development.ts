const development = {
  baseUrl: "https://msblocks.seliselocal.com",
  tokenApi: "api/identity/v20/identity/token",
  getUploadUrlApi: "api/storageservice/v22/StorageService/StorageQuery/GetPreSignedUrlForUpload",
  pollUploadStatusApi: "api/storageservice/v22/StorageService/StorageQuery/PollUploadStatus",
  prepareContractApi: "api/selisign/v42/SeliSign//ExternalApp/PrepareContract",
  prepareAndSendContractApi: "api/selisign/v42/SeliSign//ExternalApp/PrepareAndSendContract",
  sendContractApi: "api/selisign/v42/SeliSign//ExternalApp/RolloutContract",
  pollProcessApi: "api/signature/v1/Contract/PollProcess",
};

export default development;
