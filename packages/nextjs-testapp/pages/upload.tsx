import { NextPage } from 'next';
import { useState } from 'react';
import styles from '../styles/Home.module.css';
import { S3Provider, useWunderGraph, withWunderGraph } from '../components/generated/nextjs';

const UploadPage: NextPage = () => {
	const [files, setFiles] = useState<FileList>();
	const [data, setData] = useState<string[]>([]);
	const { uploadFiles } = useWunderGraph();
	const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setFiles(e.target.files);
	};
	const onSubmit = async (e: React.FormEvent<Element>) => {
		e.preventDefault();
		const result = await uploadFiles({
			provider: S3Provider.minio,
			files,
		});
		if (result.status === 'ok') {
			setData(result.fileKeys);
		}
	};

	return (
		<div className={styles.container}>
			<h1>Upload multiple files to any S3 compatible file server</h1>
			<h3>
				To enable file uploads cd into <code>minio</code>, run <code>docker-compose up</code> and then{' '}
				<code>sh setup.sh</code> to start your own S3 server using docker compose & minio.
			</h3>
			<div>
				<form onSubmit={onSubmit}>
					<input id="file-input" type="file" multiple onChange={onFileChange} />
					<button type="submit">Submit</button>
				</form>
				<ul>
					{data.map((file) => (
						<li>
							<a target="_blank" href={`http://127.0.0.1:9000/uploads/${file}`}>
								{file}
							</a>
						</li>
					))}
				</ul>
			</div>
		</div>
	);
};

export default withWunderGraph(UploadPage);
