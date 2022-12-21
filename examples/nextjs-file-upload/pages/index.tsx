import { NextPage } from 'next';
import Image from 'next/image';
import { useState } from 'react';
import { createClient } from '../components/generated/client';
import { useAuth, useFileUpload, useUser, withWunderGraph } from '../components/generated/nextjs';

const Upload = () => {
	const { login, logout } = useAuth();
	const { data: user } = useUser();

	const [files, setFiles] = useState<FileList>();
	const [data, setData] = useState<string[]>([]);

	const { upload } = useFileUpload({});

	const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files) setFiles(e.target.files);
	};

	const onSubmit = async (e: React.FormEvent<Element>) => {
		e.preventDefault();
		if (!files) {
			return;
		}
		const c = createClient();
		c.uploadFiles({
			provider: 'minio',
			files: files,
		});
		try {
			const result = await upload({
				provider: 'minio',
				files,
			});
			result && setData(result);
		} catch (e) {
			alert('Upload failed!');
			console.error("Couldn't upload files", e);
		}
	};

	if (!user) {
		return (
			<div className="mx-auto">
				<p className="text-gray-400 text-center text-sm">You need to be authenticated to upload files.</p>
				<button className="bg-white text-black p-2 rounded w-full mt-4" type="button" onClick={() => login('github')}>
					Login
				</button>
			</div>
		);
	}

	return (
		<div>
			<form className="flex flex-col items-center gap-4" onSubmit={onSubmit}>
				<input
					className="border border-slate-500 rounded"
					id="multiple_files"
					type="file"
					multiple
					onChange={onFileChange}
				/>
				<button className="bg-white text-black px-2 rounded" type="submit">
					Submit
				</button>
			</form>
			<ul>
				{data.map((file) => (
					<li className="text-center mt-8" key={file}>
						Uploaded as {file}
					</li>
				))}
			</ul>
			<button className="bg-white text-black p-2 rounded w-full mt-4" type="button" onClick={() => logout()}>
				Logout
			</button>
		</div>
	);
};

const Home: NextPage = () => {
	return (
		<div className="flex flex-col my-auto gap-y-24 lg:gap-y-32 py-4">
			<header className="flex flex-col relative">
				<Image src="/logo.svg" height={120} width={120} />
				<h1 className="font-extrabold text-4xl lg:text-6xl text-center">WunderGraph File Upload</h1>
				<p className="mt-6 text-lg text-gray-400 text-center">
					Upload multiple files to any S3 compatible file server. Check out the{' '}
					<a
						className="text-cyan-400 hover:underline"
						target="_blank"
						href="https://docs.wundergraph.com/docs/features/file-uploads-to-s3-compatible-file-storages"
					>
						Docs
					</a>
					<br />
				</p>
			</header>
			<Upload />
			<footer className="text-center text-gray-400 mx-auto">
				<p className="pt-3">
					Visit{' '}
					<a
						className="text-cyan-400 hover:underline"
						target="_blank"
						href="https://github.com/wundergraph/wundergraph"
					>
						Github
					</a>{' '}
					or{' '}
					<a className="text-cyan-400 hover:underline" target="_blank" href="https://wundergraph.com">
						Website
					</a>{' '}
					to learn more about WunderGraph.
				</p>
			</footer>
		</div>
	);
};

export default withWunderGraph(Home);
