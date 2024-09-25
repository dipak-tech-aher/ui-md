import * as React from 'react';
import { useState, useEffect } from 'react';
import {
  MinimalButton,
  Position,
  RotateDirection,
  Tooltip,
  Viewer,
  Worker,
} from '@react-pdf-viewer/core';
import {
  defaultLayoutPlugin,
  ThumbnailIcon,
} from '@react-pdf-viewer/default-layout';
import {
  RotateBackwardIcon,
  RotateForwardIcon,
} from '@react-pdf-viewer/rotate';
import type { RenderThumbnailItemProps } from '@react-pdf-viewer/thumbnail';
import { thumbnailPlugin } from '@react-pdf-viewer/thumbnail';

import UserProfile from '../AccessControl/UserProfile';
import { baseUrl } from '@src/common/Constants/Constant';
import { MagnifyingGlass } from 'react-loader-spinner';

const TOOLTIP_OFFSET = { left: 0, top: 8 };
const workerUrl =
  '//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import styled from 'styled-components';

const PDFViewerContainer = styled.div`
  position: sticky;
  top: 0;
  height: 100vh;
  z-index: 10;
  overflow: auto;
`;

const LoaderOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.7);
  z-index: 2;
`;

const LoadingMessage = styled.p`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 110%;
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  z-index: 2;
`;

const ThumbnailItems = styled.div
  .withConfig({
    shouldForwardProp: (prop) => !['isActive'].includes(prop),
  })
  .attrs({
    className: 'custom-thumbnail-item',
  })`
  cursor: pointer;
  padding: 0.5rem;
  width: 100%;
`;

const ThumbnailActions = styled.div`
  align-items: center;
  display: flex;
  justify-content: center;
  margin: 0 auto;
  width: 100px;
`;
interface PDFViewerProps {
  file: string;
}
const PDFViewer: React.FC<PDFViewerProps> = ({ file }) => {
  file = `${baseUrl}/api/File/Output/open_file.pdf`;
  const [pdfData, setPdfData] = useState<any>();
  const token = UserProfile.getAccessToken();
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!file) {
      setLoading(false);
      setPdfData(null);
      return;
    }

    setLoading(true);
    const fetchPDF = async () => {
      try {
        const response = await fetch(file, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          redirect: 'follow',
        });

        if (!response.ok) {
          throw new Error('Network response was not ok.');
        }

        const blob = await response.blob();
        const localUrl = URL.createObjectURL(blob);
        setPdfData(localUrl);
      } catch (error) {
        console.error('Error fetching the file:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPDF();
    return () => {
      if (pdfData) {
        URL.revokeObjectURL(pdfData);
      }
    };
  }, [file, token]);

  const renderThumbnailItem = (props: RenderThumbnailItemProps) => (
    <ThumbnailItems
      key={props.key}
      data-testid={`thumbnail-${props.pageIndex}`}
      onClick={props.onJumpToPage}
      //   isActive={props.pageIndex === props.currentPage}
    >
      <div style={{ marginBottom: '0.5rem' }} onClick={props.onJumpToPage}>
        {props.renderPageThumbnail}
      </div>
      <ThumbnailActions>
        <Tooltip
          position={Position.BottomCenter}
          target={
            <MinimalButton
              testId={`rotate-forward-${props.pageIndex}`}
              onClick={() => props.onRotatePage(RotateDirection.Forward)}
            >
              <RotateForwardIcon />
            </MinimalButton>
          }
          content={() => 'Rotate clockwise'}
          offset={TOOLTIP_OFFSET}
        />
        <Tooltip
          position={Position.BottomCenter}
          target={
            <MinimalButton
              testId={`rotate-backward-${props.pageIndex}`}
              onClick={() => props.onRotatePage(RotateDirection.Backward)}
            >
              <RotateBackwardIcon />
            </MinimalButton>
          }
          content={() => 'Rotate counterclockwise'}
          offset={TOOLTIP_OFFSET}
        />
      </ThumbnailActions>
    </ThumbnailItems>
  );

  const thumbnailPluginInstance = thumbnailPlugin({
    thumbnailWidth: 150,
  });
  const { Thumbnails } = thumbnailPluginInstance;

  const defaultLayoutPluginInstance = defaultLayoutPlugin({
    sidebarTabs: (defaultTabs) =>
      [
        {
          content: <Thumbnails renderThumbnailItem={renderThumbnailItem} />,
          icon: <ThumbnailIcon />,
          title: 'Thumbnails',
        },
      ].concat(defaultTabs.slice(1)),
  });

  return (
    <PDFViewerContainer>
      {loading ? (
        <LoaderOverlay>
          <MagnifyingGlass
            visible={true}
            height="80"
            width="80"
            ariaLabel="magnifying-glass-loading"
            wrapperStyle={{}}
            wrapperClass="magnifying-glass-wrapper"
            glassColor="#c0efff"
            color="#e15b64"
          />
          <LoadingMessage>Loading document...</LoadingMessage>
        </LoaderOverlay>
      ) : null}
      {!loading && pdfData ? (
        <Worker workerUrl={workerUrl}>
          <Viewer
            defaultScale={1}
            fileUrl={pdfData}
            plugins={[defaultLayoutPluginInstance, thumbnailPluginInstance]}
          />
        </Worker>
      ) : (
        !loading && <div>No document to display</div>
      )}
    </PDFViewerContainer>
  );
};

export default PDFViewer;
