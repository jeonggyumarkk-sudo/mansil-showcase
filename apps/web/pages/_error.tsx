import type { NextPageContext } from 'next';

interface ErrorProps {
    statusCode?: number;
}

function ErrorPage({ statusCode }: ErrorProps) {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            fontFamily: 'system-ui, -apple-system, sans-serif',
        }}>
            <h1 style={{ fontSize: '3rem', fontWeight: 'bold', color: '#d1d5db', marginBottom: '1rem' }}>
                {statusCode || '오류'}
            </h1>
            <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
                {statusCode === 404
                    ? '페이지를 찾을 수 없습니다.'
                    : '서버에 오류가 발생했습니다.'}
            </p>
            <a
                href="/"
                style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#2563eb',
                    color: 'white',
                    borderRadius: '0.5rem',
                    textDecoration: 'none',
                }}
            >
                홈으로 돌아가기
            </a>
        </div>
    );
}

ErrorPage.getInitialProps = ({ res, err }: NextPageContext) => {
    const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
    return { statusCode };
};

export default ErrorPage;
