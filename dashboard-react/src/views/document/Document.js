/* eslint-disable prettier/prettier */
import axios from 'axios'
import CIcon from '@coreui/icons-react'
import { cilCloudUpload, cilOpentype, cilTrash } from '@coreui/icons';
import { useState, useEffect, useRef } from 'react';
import { Col, Row } from 'react-bootstrap';
import { CButton, CFormLabel, CModal, CModalBody, CModalFooter, CModalHeader, CModalTitle } from '@coreui/react'

import Toasts from '../notifications/toasts/Toasts';

const Document = () => {
  const masinUrl = import.meta.env.VITE_API_URL;
  const inputRef = useRef(null);
  const [uploadStarted, setUploadStarted] = useState(false);
  const [totalUploads, setTotalUploads] = useState(0);
  const [uploadCount, setUploadCount] = useState(1);
  const [fileInfos, setFileInfos] = useState();
  const [totalFileUploaded, setTotalFileUploaded] = useState(0);

  const [enableToast, setEnableToast] = useState(false);
  const allowTypes = ["application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain", "application/pdf", "image/png", "image/jpg", "image/jpeg"];
  const [error, setError] = useState('');

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showFileModal, setShowFileModal] = useState(false);

  const [currentFileIndex, setCurrentFileIndex] = useState('');
  const [{ importFile }, setDragActive] = useState({ importFile: false });

  const addBtnHandler = () => {
    if (uploadCount < 5) {
      setUploadCount(prevUploadCount => prevUploadCount + 1);
    }
  }

  const deleteFileHandler = (currentIdx) => {
    setFileInfos({ ...fileInfos, [currentIdx]: {} });
  }

  useEffect(() => {
    let validFile = 0;
    Object.values(fileInfos || {}).forEach((fileData) => {
      if (Object.keys(fileData).length !== 0) {
        validFile += 1;
      }
    });
    setTotalUploads(validFile)
  }, [fileInfos])

  const removeBtnHandler = () => {
    if (uploadCount > 1) {
      setUploadCount(prevUploadCount => prevUploadCount - 1);
      uploadCount === 5 && deleteFileHandler('fifth');
      uploadCount === 4 && deleteFileHandler('fourth');
      uploadCount === 3 && deleteFileHandler('third');
      uploadCount === 2 && deleteFileHandler('second');
    }
  }

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive({ [e.target.title]: true });
    } else if (e.type === 'dragleave') {
      setDragActive({ [e.target.title]: false });
    }
  };

  const base64toBlob = (data) => {
    const fileDataType = data?.split(";")[0]?.split("data:")[1];
    const base64WithoutPrefix = data.substr(`data:${fileDataType};base64,`.length);

    const bytes = atob(base64WithoutPrefix);
    let length = bytes.length;
    let out = new Uint8Array(length);

    while (length--) {
      out[length] = bytes.charCodeAt(length);
    }

    return new Blob([out], { type: fileDataType });
  };

  const previewFile = (e, currentFile) => {

    const currentFileName = currentFile ? currentFile?.name?.charAt(0).toUpperCase() + currentFile?.name?.slice(1) : '';

    const reader = new FileReader();
    const selectedFile = e?.target?.files?.[0] || e?.dataTransfer?.files?.[0];

    selectedFile && reader.readAsDataURL(selectedFile)
    reader.onload = async (readerEvent) => {
      const previewUrl = await URL.createObjectURL(base64toBlob(readerEvent.target.result));
      await setFileInfos({
        ...fileInfos, [currentFileIndex]: {
          'file': currentFile, 'isFileValid': true, 'fileName': currentFileName, 'filePreview': previewUrl, status: 'Ready To Upload', 'fileIdx': currentFileIndex
        }
      });
    };
  }

  const handleFile = (e) => {
    const file = e?.target?.files?.[0] || e?.dataTransfer?.files?.[0];

    if (allowTypes.includes(file?.type)) {
      previewFile(e, file);
    } else {
      setFileInfos({ ...fileInfos, [currentFileIndex]: { 'isFileValid': false } });
    }

  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive({ [e.target.title]: false });
    e?.dataTransfer?.files?.[0] && handleFile(e);
  };

  const handleInputRef = () => inputRef.current.click();

  const openFileModalHandler = (currentIdx) => {
    setCurrentFileIndex(currentIdx);
    setShowUploadModal(false);
    setShowFileModal(true);
  }

  const resetEveryValues = () => {
    if (!uploadStarted) {
      setShowUploadModal(false)
      setUploadStarted(false)
    }
  }

  const submitUploadModalHandler = async () => {
    await setEnableToast(false);
    await setUploadStarted(true);
    await axios.post(`${masinUrl}/login`, { masinFileName: "masinFile-Upload" })
      .then(async tokenJson => {
        await Object?.values(fileInfos || {})?.forEach(async (currentFileInfo) => {
          if (await currentFileInfo?.isFileValid) {
            const crntFileFullName = currentFileInfo?.fileName?.split('.');
            const rndmFileName = Math.random().toString(36).slice(-7).replace(/[^a-zA-Z0-9]/g, '');
            const newDmyFileName = `${crntFileFullName[0]?.toLowerCase()} ${rndmFileName}.${crntFileFullName[1]}`;

            let fileFormData = new FormData();
            fileFormData.append("file", currentFileInfo?.file, newDmyFileName);
            // const fileIndex = currentFileInfo?.fileIdx;

            await axios.post(`${masinUrl}/masin-upload`, fileFormData, {
              headers: { 'Authorization': `Bearer ${tokenJson.data.token}` }
            }).then(async () => {
              await setTotalFileUploaded(prevUpload => prevUpload + 1);
            }).catch(err => { setError(err); console.log(err) });
          }
        });
      })
      .catch(err => { setError(err); console.log(err) })
  }

  const fileModalCloseHandler = () => {
    deleteFileHandler(currentFileIndex);
    setShowFileModal(false);
    setShowUploadModal(true);
  }

  const fileSubmitModalHandler = () => {
    setShowFileModal(false);
    setShowUploadModal(true);
  }

  const openDocUploadModalHandler = () => {
    setShowFileModal(false);
    setShowUploadModal(true);
  }

  const closeUploadModalHandler = () => {
    if (!uploadStarted) {
      setShowUploadModal(false)
      setUploadStarted(false)
    } else return null;
  }

  useEffect(() => {
    const checkDocUploaded = setInterval(async () => {
      if (totalFileUploaded === Object?.values(fileInfos || {})?.length && uploadStarted) {
        await setTotalUploads(0);
        await setUploadCount(1);
        await setFileInfos();
        await setTotalFileUploaded(0);
        await setError('');
        await setUploadStarted(false);
        await setShowUploadModal(false);
        await setEnableToast(true);
      }
    }, 2500);

    return () => clearInterval(checkDocUploaded);
  }, [fileInfos, totalFileUploaded, uploadStarted])

  return (
    <>
      <CButton color="primary" onClick={openDocUploadModalHandler}>
        Document Upload System
      </CButton>

      <CModal size="xl" visible={showUploadModal} alignment="center" aria-labelledby="uploadModalLabel" onClose={resetEveryValues}>

        <CModalHeader >
          <CModalTitle id="uploadModalLabel" className='w-100 d-flex justify-content-between align-items-center'>
            Document Upload System
          </CModalTitle>
        </CModalHeader>

        <CModalBody>
          <Row className='uploadDoc-info mx-0'>
            <Col xs={12} md={12}>
              <CFormLabel className='text-gray d-block' htmlFor="">Accepted file format:<span className='text-black fw-semibold'> PDF, DOCX, TXT, PNG/JPG</span></CFormLabel>
              <CFormLabel className='text-gray d-block' htmlFor="">Max 5 files are allowed</CFormLabel>
            </Col>

          </Row>

          <Row className='mx-0 py-3'>
            <Col xs={12} md={6}>
              <div className="upload-statement-block row mx-0 mb-3">
                <div className="col-4 pe-0 d-flex align-items-center justify-content-start">
                  <CFormLabel className='mb-0 text-black fw-semibold' htmlFor="">First Document : </CFormLabel>
                </div>
                <div className={`col-8 text-end pe-0 ${fileInfos?.first?.fileName ? 'd-flex' : ''} `}>
                  {Object?.keys(fileInfos?.first || {})?.length ? <>
                    <div className='w-100 '>
                      <div className="file-name text-center pb-1">{fileInfos?.first?.fileName}</div>
                    </div>
                    {!totalFileUploaded ?
                      <div className='ps-3 text-center my-auto d-flex justify-content-space-between'>
                        <CIcon className='mb-3 trash-icon' icon={cilTrash} size='lg' onClick={() => deleteFileHandler('first')} />
                        <a href={fileInfos?.first?.filePreview} target="_blank" >
                          <CIcon className='eye-icon' icon={cilOpentype} />
                        </a>
                      </div> : null}
                  </> : <CButton className='btn px-4 text-white' type='button' color="info" onClick={() => openFileModalHandler('first')} disabled={uploadStarted} >Upload</CButton>}
                </div>
              </div>
            </Col>

            <Col xs={12} md={6}>
              {uploadCount >= 2 && <div className="upload-statement-block row mx-0 mb-3">
                <div className="col-4 pe-0 d-flex flex-column align-items-start justify-content-start">
                  <CFormLabel className='mb-0 text-black fw-semibold' htmlFor="">Second Document : </CFormLabel>
                </div>
                <div className={`col-8 text-end pe-0 ${fileInfos?.second?.fileName ? 'd-flex' : ''} `}>
                  {Object?.keys(fileInfos?.second || {})?.length ? <>
                    <div className='w-100 '>
                      <div className="file-name text-center pb-1">{fileInfos?.second?.fileName}</div>
                    </div>

                    {!totalFileUploaded ?
                      <div className='ps-3 text-center my-auto d-flex justify-content-space-between'>
                        <CIcon className='mb-3 trash-icon' icon={cilTrash} size='lg' onClick={() => deleteFileHandler('second')} />
                        <a href={fileInfos?.second?.filePreview} target="_blank" >
                          <CIcon className='eye-icon' icon={cilOpentype} />
                        </a>
                      </div> : null}
                  </> : <CButton className='btn px-4 text-white' type='button' color="info" onClick={() => openFileModalHandler('second')} disabled={uploadStarted} >Upload</CButton>}
                </div>
              </div>}
            </Col>
          </Row>

          <Row className='mx-0 py-1'>
            <Col xs={12} md={6}>
              {uploadCount >= 3 && <div className="upload-statement-block row mx-0 mb-3">
                <div className="col-4 pe-0 d-flex flex-column align-items-start justify-content-start">
                  <CFormLabel className='mb-0 text-black fw-semibold' htmlFor="">Third Document : </CFormLabel>
                </div>
                <div className={`col-8 text-end pe-0 ${fileInfos?.third?.fileName ? 'd-flex' : ''} `}>
                  {Object?.keys(fileInfos?.third || {})?.length ? <>
                    <div className='w-100 '>
                      <div className="file-name text-center pb-1">{fileInfos?.third?.fileName}</div>
                    </div>

                    {!totalFileUploaded ?
                      <div className='ps-3 text-center my-auto d-flex justify-content-space-between'>
                        <CIcon className='mb-3 trash-icon' icon={cilTrash} size='lg' onClick={() => deleteFileHandler('third')} />
                        <a href={fileInfos?.third?.filePreview} target="_blank" >
                          <CIcon className='eye-icon' icon={cilOpentype} />
                        </a>
                      </div> : null}
                  </> : <CButton className='btn px-4 text-white' type='button' color="info" onClick={() => openFileModalHandler('third')} disabled={uploadStarted} >Upload</CButton>}
                </div>
              </div>}
            </Col>

            <Col xs={12} md={6}>
              {uploadCount >= 4 && <div className="upload-statement-block row mx-0 mb-3">
                <div className="col-4 pe-0 d-flex flex-column align-items-start justify-content-start">
                  <CFormLabel className='mb-0 text-black fw-semibold' htmlFor="">Fourth Document : </CFormLabel>
                </div>
                <div className={`col-8 text-end pe-0 ${fileInfos?.fourth?.fileName ? 'd-flex' : ''} `}>
                  {Object?.keys(fileInfos?.fourth || {})?.length ? <>
                    <div className='w-100 '>
                      <div className="file-name text-center pb-1">{fileInfos?.fourth?.fileName}</div>
                    </div>

                    {!totalFileUploaded ?
                      <div className='ps-3 text-center my-auto d-flex justify-content-space-between'>
                        <CIcon className='mb-3 trash-icon' icon={cilTrash} size='lg' onClick={() => deleteFileHandler('fourth')} />
                        <a href={fileInfos?.fourth?.filePreview} target="_blank" >
                          <CIcon className='eye-icon' icon={cilOpentype} />
                        </a>
                      </div> : null}
                  </> : <CButton className='btn px-4 text-white' type='button' color="info" onClick={() => openFileModalHandler('fourth')} disabled={uploadStarted} >Upload</CButton>}
                </div>
              </div>}
            </Col>
          </Row>

          <Row className='mx-0 py-1'>
            <Col xs={12} md={6}>
              {uploadCount >= 5 && <div className="upload-statement-block row mx-0 mb-3">
                <div className="col-4 pe-0 d-flex flex-column align-items-start justify-content-start">
                  <CFormLabel className='mb-0 text-black fw-semibold' htmlFor="">Fifth Document : </CFormLabel>
                </div>
                <div className={`col-8 text-end pe-0 ${fileInfos?.fifth?.fileName ? 'd-flex' : ''} `}>
                  {Object?.keys(fileInfos?.fifth || {})?.length ? <>
                    <div className='w-100 '>
                      <div className="file-name text-center pb-1">{fileInfos?.fifth?.fileName}</div>
                    </div>

                    {!totalFileUploaded ?
                      <div className='ps-3 text-center my-auto d-flex justify-content-space-between'>
                        <CIcon className='mb-3 trash-icon' icon={cilTrash} size='lg' onClick={() => deleteFileHandler('fifth')} />
                        <a href={fileInfos?.fifth?.filePreview} target="_blank" >
                          <CIcon className='eye-icon' icon={cilOpentype} />
                        </a>
                      </div> : null}
                  </> : <CButton className='btn px-4 text-white' type='button' color="info" onClick={() => openFileModalHandler('fifth')} disabled={uploadStarted} >Upload</CButton>}
                </div>
              </div>}
            </Col>
          </Row>

          {
            <Row className='mx-0 py-2'>
              <Col xs={6} md={6}>
                {uploadCount !== 5 &&
                  <div className="text-center w-100">
                    <CButton color="primary" className='btn text-blue border-blue py-1' onClick={addBtnHandler} disabled={uploadStarted}>+ Add</CButton>
                  </div>
                }
              </Col>

              {uploadCount > 1 &&
                <Col xs={6} md={6}>
                  <div className="text-center w-100">
                    <CButton color="secondary" className='btn text-blue border-blue py-1' onClick={removeBtnHandler} disabled={uploadStarted}>- Remove</CButton>
                  </div>
                </Col>
              }
            </Row>}

        </CModalBody>

        <CModalFooter>
          <div className="w-100 d-flex justify-content-between justify-content-md-end align-items-center">
            {!uploadStarted ? <>
              <CButton type="button" color="danger" className="px-3 px-md-5 me-3 text-white" onClick={closeUploadModalHandler} disabled={uploadStarted}>Cancel</CButton>
              <CButton type="button" color="success" className="px-3 px-md-5 text-white" disabled={!totalUploads} onClick={submitUploadModalHandler}>Submit</CButton>
            </> : <CButton type='button' color='success' className='text-white' disabled={uploadStarted}>
              {totalFileUploaded ? `${totalFileUploaded} File Uploaded` : 'Uploading ...'}
              {/* {totalFileUploaded && fileUploadedMsg === '' ? `${totalFileUploaded} File Uploaded` : null} */}
              {/* {totalFileUploaded && fileUploadedMsg !== '' ? 'Uploaded Successfully' : null}
              {!totalFileUploaded && fileUploadedMsg !== '' ? 'Uploading ...' : null} */}
            </CButton>
            }
          </div>
        </CModalFooter>

      </CModal >

      <CModal size="xl" visible={showFileModal} alignment="center" aria-labelledby="uploadFileLabel" onClose={() => setShowFileModal(false)}>

        <CModalHeader >
          <CModalTitle className="modal-title h4 w-100 d-flex align-items-center justify-content-between" id="uploadFileLabel">
            Document Upload System
          </CModalTitle>
        </CModalHeader>

        <CModalBody>
          <Row className=''>
            <Col xs={12} md={12} className='mb-2'>
              <CFormLabel className='text-gray d-block' htmlFor="">Accepted file format:<span className='text-black fw-semibold'> PDF, DOCX, TXT, PNG/JPG</span></CFormLabel>
              <CFormLabel className='text-gray d-block' htmlFor="">Max file size: <span className='text-black fw-semibold'> 50MB</span></CFormLabel>
            </Col>
          </Row>
          <Row className='uploadDoc m-0 m-md-0 px-4 py-4 row '>
            <div
              onDrop={handleDrop}
              onDragOver={handleDrag}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onChange={handleFile}>

              <div className="drag-wrap text-center pb-4 pt-2 d-flex flex-column align-items-center ">

                <input accept={allowTypes} ref={inputRef} type="file" style={{ display: 'none' }} onChange={handleFile} />
                <CIcon className='mb-3 upload-icon' icon={cilCloudUpload} onClick={handleInputRef} />
                <small className='text-gray mb-3'>File could be in PDF, DOCX, TXT, PNG/JPG Format</small>
                <CButton className='btn px-3 px-md-5 me-3' onClick={handleInputRef} >Browse</CButton>

                {fileInfos?.[currentFileIndex]?.fileName !== '' && (
                  <div className='col-12 mt-2'>
                    {fileInfos?.[currentFileIndex]?.isFileValid && <p className="file-success">
                      {fileInfos?.[currentFileIndex]?.fileName}
                    </p>}
                    {fileInfos?.[currentFileIndex]?.isFileValid === false && <p className="file-error">Only pdf,docx,txt,png/jpg file are allowed</p>}
                  </div>
                )}

              </div>
            </div>
          </Row>
        </CModalBody>

        <CModalFooter className='px-3'>
          <div className="w-100 d-flex justify-content-between justify-content-md-end align-items-center">
            <CButton type="button" color="danger" className="px-3 px-md-5 me-3  text-white" onClick={fileModalCloseHandler}>Cancel</CButton>
            <CButton type="button" color="success" className="px-3 px-md-5 text-white" onClick={fileSubmitModalHandler} disabled={!fileInfos?.[currentFileIndex]?.isFileValid}>Submit</CButton>
          </div>
        </CModalFooter>

      </CModal>

      <Toasts toastView={enableToast} closeToast={() => setEnableToast(false)} />
    </>
  )
}

export default Document
