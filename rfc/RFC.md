## How to create RFCs

1. for each new RFC, create a new branch
2. create a new folder in `rfc/` with the name of the RFC
3. create a new file in the folder with the name `[RFC] <RFC name> - <RFC number> - <your github handle>.md`

The RFC number is the next number in the sequence of RFCs. The RFC number is used to sort the RFCs in the RFC folder.
All RFC documents are prefixed with `[RFC]` to make them easy to find in the RFC folder.
Repeat the RFC name in the file name to make it easy to find the RFC in the file system.

4. open a pull request for the branch
5. get feedback on the RFC via the pull request
6. merge the pull request once all feedback has been addressed and you consider the RFC ready

## How to turn RFCs into specifications

Once an RFC has been merged, it is ready to be discussed with the team and turned into a specification.
If the team accepts the RFC, the RFC is turned into a specification and the RFC is moved to the `specs/` folder.

To turn an RFC into a specification, create a new branch and copy the RFC into the `specs/` folder.
You might want to add additional information from the discussion with the team.
Once the specification is ready, open a pull request and merge it.
This gives the team another chance to review the final specification.
Once merged, the specification is ready to be implemented.
