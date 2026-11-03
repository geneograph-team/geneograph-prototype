const sampleData = {
    projects: [
        { id: 'p1', name: 'Whiskerfield Family Tree', defaultPersonId: 'silver', created: '01 May 2026', modified: '24 May 2026', modifiedAt: '2026-05-24T10:42:00Z', status: 'Local project', cover: 'golden-tree', files: 5, notes: 7, desc: 'Research into the Whiskerfield and Purrington family lines from Pawford, Meowbridge, Fishmarket Row, and Old Cattery.' }
    ],
    projectContinuation: {
        projectId: 'p1',
        module: 'Albums',
        openedAt: '2026-06-16T10:42:00Z'
    },
    people: [
        {
            id: 'silver',
            projectId: 'p1',
            createdAt: '2025-01-12T10:00:00Z',
            updatedAt: '2026-05-10T10:00:00Z',
            primaryPhotoId: 'photo-silver-portrait',

            names: {
                first: 'Silver',
                middle: '',
                last: 'Whiskerfield',
                maiden: '',
                display: 'Silver Whiskerfield',
                initials: 'SW'
            },

            gender: 'male',
            livingStatus: 'Living',
            avatarClass: 'avatar-green',

            birth: {
                date: '03.03.1998',
                dateLabel: '03 Mar 1998',
                dateType: 'Exact date',
                placeId: 'place-pawford'
            },

            death: {
                date: '',
                dateLabel: '',
                dateType: 'Exact date',
                placeId: null,
                reason: '',
                burialPlaceId: null
            },

            meta: {
                updated: '10 May 2026',
                sourceStatus: 'Partly sourced',
            }
        },

        {
            id: 'luna',
            projectId: 'p1',
            createdAt: '2025-01-12T10:05:00Z',
            updatedAt: '2026-05-10T10:05:00Z',
            primaryPhotoId: 'photo-luna-portrait',

            names: {
                first: 'Luna',
                middle: 'Mabel',
                last: 'Whiskerfield',
                maiden: 'Purrington',
                display: 'Luna Mabel Whiskerfield',
                initials: 'LW'
            },

            gender: 'female',
            livingStatus: 'Living',
            avatarClass: 'avatar-purple',

            birth: {
                date: '12.08.1999',
                dateLabel: '12 Aug 1999',
                dateType: 'Exact date',
                placeId: 'place-meowbridge'
            },

            death: {
                date: '',
                dateLabel: '',
                dateType: 'Exact date',
                placeId: null,
                reason: '',
                burialPlaceId: null
            },

            meta: {
                updated: '10 May 2026',
                sourceStatus: 'Partly sourced',
            }
        },

        {
            id: 'oliver',
            projectId: 'p1',
            createdAt: '2025-01-13T09:00:00Z',
            updatedAt: '2026-05-09T09:00:00Z',
            primaryPhotoId: 'photo-oliver-portrait',

            names: {
                first: 'Oliver',
                middle: 'Felix',
                last: 'Whiskerfield',
                maiden: '',
                display: 'Oliver Felix Whiskerfield',
                initials: 'OW'
            },

            gender: 'male',
            livingStatus: 'Living',
            avatarClass: 'avatar-amber',

            birth: {
                date: '18.05.2024',
                dateLabel: '18 May 2024',
                dateType: 'Exact date',
                placeId: 'place-pawford'
            },

            death: {
                date: '',
                dateLabel: '',
                dateType: 'Exact date',
                placeId: null,
                reason: '',
                burialPlaceId: null
            },

            meta: {
                updated: '9 May 2026',
                sourceStatus: 'Unsourced',
            }
        },

        {
            id: 'mochi',
            projectId: 'p1',
            createdAt: '2025-01-14T09:00:00Z',
            updatedAt: '2026-05-09T09:05:00Z',

            names: {
                first: 'Mochi',
                middle: '',
                last: 'Whiskerfield',
                maiden: '',
                display: 'Mochi Whiskerfield',
                initials: 'MW'
            },

            gender: 'female',
            livingStatus: 'Living',
            avatarClass: 'avatar-purple',

            birth: {
                date: '07.09.2025',
                dateLabel: '07 Sep 2025',
                dateType: 'Exact date',
                placeId: null
            },

            death: {
                date: '',
                dateLabel: '',
                dateType: 'Exact date',
                placeId: null,
                reason: '',
                burialPlaceId: null
            },

            meta: {
                updated: '9 May 2026',
                sourceStatus: 'Unsourced',
            }
        },

        {
            id: 'cleo',
            projectId: 'p1',
            createdAt: '2025-01-15T09:00:00Z',
            updatedAt: '2026-05-04T08:30:00Z',

            names: {
                first: 'Cleo',
                middle: '',
                last: 'Whiskerfield',
                maiden: '',
                display: 'Cleo Whiskerfield',
                initials: 'CW'
            },

            gender: 'female',
            livingStatus: 'Living',
            avatarClass: 'avatar-purple',

            birth: {
                date: '',
                dateLabel: '',
                dateType: 'Exact date',
                placeId: null
            },

            death: {
                date: '',
                dateLabel: '',
                dateType: 'Exact date',
                placeId: null,
                reason: '',
                burialPlaceId: null
            },

            meta: {
                updated: '4 May 2026',
                sourceStatus: 'Unsourced',
            }
        },

        {
            id: 'barnaby',
            projectId: 'p1',
            createdAt: '2025-01-16T09:00:00Z',
            updatedAt: '2026-05-04T09:00:00Z',
            primaryPhotoId: 'photo-barnaby-portrait',

            names: {
                first: 'Barnaby',
                middle: '',
                last: 'Whiskerfield',
                maiden: '',
                display: 'Barnaby Whiskerfield',
                initials: 'BW'
            },

            gender: 'male',
            livingStatus: 'Deceased',
            avatarClass: '',

            birth: {
                date: '14.02.1946',
                dateLabel: '14 Feb 1946',
                dateType: 'Exact date',
                placeId: 'place-pawford'
            },

            death: {
                date: '22.11.2018',
                dateLabel: '22 Nov 2018',
                dateType: 'Exact date',
                placeId: 'place-pawford',
                reason: '',
                burialPlaceId: 'place-pawford'
            },

            meta: {
                updated: '4 May 2026',
                sourceStatus: 'Partly sourced',
            }
        },

        {
            id: 'daisy',
            projectId: 'p1',
            createdAt: '2025-01-17T09:00:00Z',
            updatedAt: '2026-05-04T09:05:00Z',
            primaryPhotoId: 'photo-daisy-school',

            names: {
                first: 'Daisy',
                middle: '',
                last: 'Whiskerfield',
                maiden: 'Milkpaw',
                display: 'Daisy Whiskerfield',
                initials: 'DW'
            },

            gender: 'female',
            livingStatus: 'Deceased',
            avatarClass: 'avatar-purple',

            birth: {
                date: '03.06.1949',
                dateLabel: '03 Jun 1949',
                dateType: 'Exact date',
                placeId: null
            },

            death: {
                date: '04.01.2020',
                dateLabel: '04 Jan 2020',
                dateType: 'Exact date',
                placeId: 'place-meowbridge',
                reason: '',
                burialPlaceId: 'place-meowbridge'
            },

            meta: {
                updated: '4 May 2026',
                sourceStatus: 'Partly sourced',
            }
        },

        {
            id: 'rupert',
            projectId: 'p1',
            createdAt: '2025-01-18T09:00:00Z',
            updatedAt: '2026-04-28T10:00:00Z',

            names: {
                first: 'Rupert',
                middle: '',
                last: 'Purrington',
                maiden: '',
                display: 'Rupert Purrington',
                initials: 'RP'
            },

            gender: 'male',
            livingStatus: 'Deceased',
            avatarClass: '',

            birth: {
                date: '19.10.1951',
                dateLabel: '19 Oct 1951',
                dateType: 'Exact date',
                placeId: 'place-fishmarket-row'
            },

            death: {
                date: '',
                dateLabel: '',
                dateType: 'Exact date',
                placeId: null,
                reason: '',
                burialPlaceId: null
            },

            meta: {
                updated: '28 Apr 2026',
                sourceStatus: 'Partly sourced',
            }
        },

        {
            id: 'mabel',
            projectId: 'p1',
            createdAt: '2025-01-19T09:00:00Z',
            updatedAt: '2026-04-28T10:05:00Z',

            names: {
                first: 'Mabel',
                middle: '',
                last: 'Purrington',
                maiden: 'Softtail',
                display: 'Mabel Purrington',
                initials: 'MP'
            },

            gender: 'female',
            livingStatus: 'Living',
            avatarClass: 'avatar-purple',

            birth: {
                date: '28.04.1955',
                dateLabel: '28 Apr 1955',
                dateType: 'Exact date',
                placeId: 'place-meowbridge'
            },

            death: {
                date: '',
                dateLabel: '',
                dateType: 'Exact date',
                placeId: null,
                reason: '',
                burialPlaceId: null
            },

            meta: {
                updated: '28 Apr 2026',
                sourceStatus: 'Partly sourced',
            }
        },

        {
            id: 'archibald',
            projectId: 'p1',
            createdAt: '2025-01-20T09:00:00Z',
            updatedAt: '2026-04-24T08:00:00Z',

            names: {
                first: 'Archibald',
                middle: '',
                last: 'Whiskerfield',
                maiden: '',
                display: 'Archibald Whiskerfield',
                initials: 'AW'
            },

            gender: 'male',
            livingStatus: 'Deceased',
            avatarClass: '',

            primaryPhotoId: 'photo-archibald-workshop',

            birth: {
                date: '02.01.1915',
                dateLabel: '02 Jan 1915',
                dateType: 'Exact date',
                placeId: 'place-pawford'
            },

            death: {
                date: '17.07.1982',
                dateLabel: '17 Jul 1982',
                dateType: 'Exact date',
                placeId: 'place-pawford',
                reason: '',
                burialPlaceId: 'place-pawford'
            },

            meta: {
                updated: '24 Apr 2026',
                sourceStatus: 'Partly sourced',
            }
        },

        {
            id: 'edith',
            projectId: 'p1',
            createdAt: '2025-01-21T09:00:00Z',
            updatedAt: '2026-04-24T08:05:00Z',

            names: {
                first: 'Edith',
                middle: '',
                last: 'Whiskerfield',
                maiden: 'Mackerelton',
                display: 'Edith Whiskerfield',
                initials: 'EW'
            },

            gender: 'female',
            livingStatus: 'Deceased',
            avatarClass: 'avatar-purple',

            birth: {
                date: '21.09.1918',
                dateLabel: '21 Sep 1918',
                dateType: 'Exact date',
                placeId: 'place-old-cattery'
            },

            death: {
                date: '03.03.1991',
                dateLabel: '03 Mar 1991',
                dateType: 'Exact date',
                placeId: null,
                reason: '',
                burialPlaceId: null
            },

            meta: {
                updated: '24 Apr 2026',
                sourceStatus: 'Partly sourced',
            }
        },

        {
            id: 'percival',
            projectId: 'p1',
            createdAt: '2025-01-22T09:00:00Z',
            updatedAt: '2026-04-24T08:10:00Z',

            names: {
                first: 'Percival',
                middle: '',
                last: 'Milkpaw',
                maiden: '',
                display: 'Percival Milkpaw',
                initials: 'PM'
            },

            gender: 'male',
            livingStatus: 'Deceased',
            avatarClass: '',

            birth: {
                date: '',
                dateLabel: '',
                dateType: 'Exact date',
                placeId: null
            },

            death: {
                date: '1968',
                dateLabel: '1968',
                dateType: 'Exact date',
                placeId: 'place-meowbridge',
                reason: '',
                burialPlaceId: 'place-meowbridge'
            },

            meta: {
                updated: '24 Apr 2026',
                sourceStatus: 'Unsourced',
            }
        },

        {
            id: 'nora',
            projectId: 'p1',
            createdAt: '2025-01-23T09:00:00Z',
            updatedAt: '2026-04-24T08:15:00Z',

            names: {
                first: 'Nora',
                middle: '',
                last: 'Milkpaw',
                maiden: 'Creamfur',
                display: 'Nora Milkpaw',
                initials: 'NM'
            },

            gender: 'female',
            livingStatus: 'Deceased',
            avatarClass: 'avatar-purple',

            birth: {
                date: '11.11.1922',
                dateLabel: '11 Nov 1922',
                dateType: 'Exact date',
                placeId: 'place-meowbridge'
            },

            death: {
                date: '',
                dateLabel: '',
                dateType: 'Exact date',
                placeId: null,
                reason: '',
                burialPlaceId: null
            },

            meta: {
                updated: '24 Apr 2026',
                sourceStatus: 'Unsourced',
            }
        },

        {
            id: 'algernon',
            projectId: 'p1',
            createdAt: '2025-01-24T09:00:00Z',
            updatedAt: '2026-04-24T08:20:00Z',

            names: {
                first: 'Algernon',
                middle: '',
                last: 'Purrington',
                maiden: '',
                display: 'Algernon Purrington',
                initials: 'AP'
            },

            gender: 'male',
            livingStatus: 'Deceased',
            avatarClass: '',

            birth: {
                date: '08.05.1920',
                dateLabel: '08 May 1920',
                dateType: 'Exact date',
                placeId: 'place-fishmarket-row'
            },

            death: {
                date: '09.12.1999',
                dateLabel: '09 Dec 1999',
                dateType: 'Exact date',
                placeId: 'place-fishmarket-row',
                reason: '',
                burialPlaceId: 'place-fishmarket-row'
            },

            meta: {
                updated: '24 Apr 2026',
                sourceStatus: 'Partly sourced',
            }
        },

        {
            id: 'beatrice',
            projectId: 'p1',
            createdAt: '2025-01-25T09:00:00Z',
            updatedAt: '2026-04-24T08:25:00Z',

            names: {
                first: 'Beatrice',
                middle: '',
                last: 'Purrington',
                maiden: 'Threadtail',
                display: 'Beatrice Purrington',
                initials: 'BP'
            },

            gender: 'female',
            livingStatus: 'Deceased',
            avatarClass: 'avatar-purple',

            birth: {
                date: '30.03.1924',
                dateLabel: '30 Mar 1924',
                dateType: 'Exact date',
                placeId: null
            },

            death: {
                date: '15.06.2004',
                dateLabel: '15 Jun 2004',
                dateType: 'Exact date',
                placeId: 'place-meowbridge',
                reason: '',
                burialPlaceId: 'place-meowbridge'
            },

            meta: {
                updated: '24 Apr 2026',
                sourceStatus: 'Partly sourced',
            }
        },

        {
            id: 'felix',
            projectId: 'p1',
            createdAt: '2025-01-26T09:00:00Z',
            updatedAt: '2026-04-24T08:30:00Z',

            names: {
                first: 'Felix',
                middle: '',
                last: 'Softtail',
                maiden: '',
                display: 'Felix Softtail',
                initials: 'FS'
            },

            gender: 'male',
            livingStatus: 'Deceased',
            avatarClass: '',

            birth: {
                date: '1919',
                dateLabel: '1919',
                dateType: 'Exact date',
                placeId: null
            },

            death: {
                date: '',
                dateLabel: '',
                dateType: 'Exact date',
                placeId: null,
                reason: '',
                burialPlaceId: null
            },

            meta: {
                updated: '24 Apr 2026',
                sourceStatus: 'Unsourced',
            }
        },

        {
            id: 'pearl',
            projectId: 'p1',
            createdAt: '2025-01-27T09:00:00Z',
            updatedAt: '2026-04-24T08:35:00Z',

            names: {
                first: 'Pearl',
                middle: '',
                last: 'Softtail',
                maiden: 'Velvetpaw',
                display: 'Pearl Softtail',
                initials: 'PS'
            },

            gender: 'female',
            livingStatus: 'Deceased',
            avatarClass: 'avatar-purple',

            primaryPhotoId: 'photo-pearl-portrait',

            birth: {
                date: '27.12.1927',
                dateLabel: '27 Dec 1927',
                dateType: 'Exact date',
                placeId: 'place-old-cattery'
            },

            death: {
                date: '02.02.2011',
                dateLabel: '02 Feb 2011',
                dateType: 'Exact date',
                placeId: 'place-old-cattery',
                reason: '',
                burialPlaceId: 'place-old-cattery'
            },

            meta: {
                updated: '24 Apr 2026',
                sourceStatus: 'Unsourced',
            }
        },

        {
            id: 'solomon',
            projectId: 'p1',
            createdAt: '2025-01-28T09:00:00Z',
            updatedAt: '2026-05-24T09:00:00Z',

            names: {
                first: 'Solomon',
                middle: '',
                last: 'Velvetpaw',
                maiden: '',
                display: 'Solomon Velvetpaw',
                initials: 'SV'
            },

            gender: 'male',
            livingStatus: 'Deceased',
            avatarClass: 'avatar-amber',

            birth: {
                date: '1896',
                dateLabel: '1896',
                dateType: 'Exact date',
                placeId: 'place-old-cattery'
            },

            death: {
                date: '14.04.1961',
                dateLabel: '14 Apr 1961',
                dateType: 'Exact date',
                placeId: 'place-old-cattery',
                reason: '',
                burialPlaceId: 'place-old-cattery'
            },

            meta: {
                updated: '24 May 2026',
                sourceStatus: 'Partly sourced',
            }
        },

        {
            id: 'opal',
            projectId: 'p1',
            createdAt: '2025-01-29T09:00:00Z',
            updatedAt: '2026-05-24T09:05:00Z',

            names: {
                first: 'Opal',
                middle: '',
                last: 'Velvetpaw',
                maiden: 'Silktail',
                display: 'Opal Velvetpaw',
                initials: 'OV'
            },

            gender: 'female',
            livingStatus: 'Deceased',
            avatarClass: 'avatar-purple',

            birth: {
                date: '',
                dateLabel: '',
                dateType: 'Exact date',
                placeId: null
            },

            death: {
                date: '09.09.1970',
                dateLabel: '09 Sep 1970',
                dateType: 'Exact date',
                placeId: 'place-old-cattery',
                reason: '',
                burialPlaceId: 'place-old-cattery'
            },

            meta: {
                updated: '24 May 2026',
                sourceStatus: 'Needs source',
            }
        },

        {
            id: 'horatio',
            projectId: 'p1',
            createdAt: '2025-01-30T09:00:00Z',
            updatedAt: '2026-05-24T09:10:00Z',

            names: {
                first: 'Horatio',
                middle: '',
                last: 'Threadtail',
                maiden: '',
                display: 'Horatio Threadtail',
                initials: 'HT'
            },

            gender: 'male',
            livingStatus: 'Deceased',
            avatarClass: 'avatar-blue',

            birth: {
                date: '1898',
                dateLabel: '1898',
                dateType: 'Exact date',
                placeId: null
            },

            death: {
                date: '',
                dateLabel: '',
                dateType: 'Exact date',
                placeId: null,
                reason: '',
                burialPlaceId: null
            },

            meta: {
                updated: '24 May 2026',
                sourceStatus: 'Unsourced',
            }
        },

        {
            id: 'clementine',
            projectId: 'p1',
            createdAt: '2025-01-31T09:00:00Z',
            updatedAt: '2026-05-24T09:15:00Z',

            names: {
                first: 'Clementine',
                middle: '',
                last: 'Purrington',
                maiden: '',
                display: 'Clementine Purrington',
                initials: 'CP'
            },

            gender: 'female',
            livingStatus: 'Deceased',
            avatarClass: 'avatar-purple',

            birth: {
                date: '1894',
                dateLabel: '1894',
                dateType: 'Exact date',
                placeId: 'place-fishmarket-row'
            },

            death: {
                date: '22.02.1966',
                dateLabel: '22 Feb 1966',
                dateType: 'Exact date',
                placeId: null,
                reason: '',
                burialPlaceId: null
            },

            meta: {
                updated: '24 May 2026',
                sourceStatus: 'Partly sourced',
            }
        },

        {
            id: 'augustus',
            projectId: 'p1',
            createdAt: '2025-02-01T09:00:00Z',
            updatedAt: '2026-05-24T09:20:00Z',

            names: {
                first: 'Augustus',
                middle: '',
                last: 'Whiskerfield',
                maiden: '',
                display: 'Augustus Whiskerfield',
                initials: 'AW'
            },

            gender: 'male',
            livingStatus: 'Deceased',
            avatarClass: 'avatar-green',

            birth: {
                date: '1887',
                dateLabel: '1887',
                dateType: 'Exact date',
                placeId: 'place-pawford'
            },

            death: {
                date: '05.05.1954',
                dateLabel: '05 May 1954',
                dateType: 'Exact date',
                placeId: 'place-pawford',
                reason: '',
                burialPlaceId: 'place-pawford'
            },

            meta: {
                updated: '24 May 2026',
                sourceStatus: 'Partly sourced',
            }
        },

        {
            id: 'tobias',
            projectId: 'p1',
            createdAt: '2025-02-02T09:00:00Z',
            updatedAt: '2026-05-24T09:25:00Z',

            names: {
                first: 'Tobias',
                middle: '',
                last: 'Creamfur',
                maiden: '',
                display: 'Tobias Creamfur',
                initials: 'TC'
            },

            gender: 'male',
            livingStatus: 'Deceased',
            avatarClass: 'avatar-amber',

            birth: {
                date: '1891',
                dateLabel: '1891',
                dateType: 'Exact date',
                placeId: 'place-meowbridge'
            },

            death: {
                date: '',
                dateLabel: '',
                dateType: 'Exact date',
                placeId: null,
                reason: '',
                burialPlaceId: null
            },

            meta: {
                updated: '24 May 2026',
                sourceStatus: 'Unsourced',
            }
        },

        {
            id: 'marigold',
            projectId: 'p1',
            createdAt: '2025-02-03T09:00:00Z',
            updatedAt: '2026-05-24T09:30:00Z',

            names: {
                first: 'Marigold',
                middle: '',
                last: 'Butterpaws',
                maiden: '',
                display: 'Marigold Butterpaws',
                initials: 'MB'
            },

            gender: 'female',
            livingStatus: 'Deceased',
            avatarClass: 'avatar-purple',

            birth: {
                date: '',
                dateLabel: '',
                dateType: 'Exact date',
                placeId: null
            },

            death: {
                date: '03.08.1968',
                dateLabel: '03 Aug 1968',
                dateType: 'Exact date',
                placeId: 'place-meowbridge',
                reason: '',
                burialPlaceId: 'place-meowbridge'
            },

            meta: {
                updated: '24 May 2026',
                sourceStatus: 'Partly sourced',
            }
        }
    ],
    relationshipSeed: [
        { id: 'rel-archibald-edith-partner', projectId: 'p1', type: 'family', gedcomXref: '@FRELARCHIBALDEDITHPARTNER@', partnerAId: 'archibald', partnerBId: 'edith', personAId: 'archibald', personBId: 'edith', partnerARoleHint: '', partnerBRoleHint: '', childrenIds: [], relationshipType: 'Married', relationshipStatus: 'active', events: [{ id: 'rel-archibald-edith-partner-marriage', eventType: 'Marriage', gedcomTag: 'MARR', typeLabel: 'Civil', date: { date: '', dateLabel: '', dateType: 'Exact date', calendar: 'Gregorian', originalText: '' }, placeId: null, placeText: '', sortDate: '', confidence: '' }], nonEvents: [], createdAt: '', updatedAt: '' },
        { id: 'rel-percival-nora-partner', projectId: 'p1', type: 'family', gedcomXref: '@FRELPERCIVALNORAPARTNER@', partnerAId: 'percival', partnerBId: 'nora', personAId: 'percival', personBId: 'nora', partnerARoleHint: '', partnerBRoleHint: '', childrenIds: [], relationshipType: 'Married', relationshipStatus: 'active', events: [{ id: 'rel-percival-nora-partner-marriage', eventType: 'Marriage', gedcomTag: 'MARR', typeLabel: 'Civil', date: { date: '', dateLabel: '', dateType: 'Exact date', calendar: 'Gregorian', originalText: '' }, placeId: null, placeText: '', sortDate: '', confidence: '' }], nonEvents: [], createdAt: '', updatedAt: '' },
        { id: 'rel-algernon-beatrice-partner', projectId: 'p1', type: 'family', gedcomXref: '@FRELALGERNONBEATRICEPARTNER@', partnerAId: 'algernon', partnerBId: 'beatrice', personAId: 'algernon', personBId: 'beatrice', partnerARoleHint: '', partnerBRoleHint: '', childrenIds: [], relationshipType: 'Married', relationshipStatus: 'active', events: [{ id: 'rel-algernon-beatrice-partner-marriage', eventType: 'Marriage', gedcomTag: 'MARR', typeLabel: 'Civil', date: { date: '', dateLabel: '', dateType: 'Exact date', calendar: 'Gregorian', originalText: '' }, placeId: null, placeText: '', sortDate: '', confidence: '' }], nonEvents: [], createdAt: '', updatedAt: '' },
        { id: 'rel-felix-pearl-partner', projectId: 'p1', type: 'family', gedcomXref: '@FRELFELIXPEARLPARTNER@', partnerAId: 'felix', partnerBId: 'pearl', personAId: 'felix', personBId: 'pearl', partnerARoleHint: '', partnerBRoleHint: '', childrenIds: [], relationshipType: 'Married', relationshipStatus: 'active', events: [{ id: 'rel-felix-pearl-partner-marriage', eventType: 'Marriage', gedcomTag: 'MARR', typeLabel: 'Civil', date: { date: '', dateLabel: '', dateType: 'Exact date', calendar: 'Gregorian', originalText: '' }, placeId: null, placeText: '', sortDate: '', confidence: '' }], nonEvents: [], createdAt: '', updatedAt: '' },
        { id: 'rel-barnaby-daisy-partner', projectId: 'p1', type: 'family', gedcomXref: '@FRELBARNABYDAISYPARTNER@', partnerAId: 'barnaby', partnerBId: 'daisy', personAId: 'barnaby', personBId: 'daisy', partnerARoleHint: '', partnerBRoleHint: '', childrenIds: [], relationshipType: 'Married', relationshipStatus: 'active', events: [{ id: 'rel-barnaby-daisy-partner-marriage', eventType: 'Marriage', gedcomTag: 'MARR', typeLabel: 'Civil', date: { date: '', dateLabel: '', dateType: 'Exact date', calendar: 'Gregorian', originalText: '' }, placeId: null, placeText: '', sortDate: '', confidence: '' }], nonEvents: [], createdAt: '', updatedAt: '' },
        { id: 'rel-rupert-mabel-partner', projectId: 'p1', type: 'family', gedcomXref: '@FRELRUPERTMABELPARTNER@', partnerAId: 'rupert', partnerBId: 'mabel', personAId: 'rupert', personBId: 'mabel', partnerARoleHint: '', partnerBRoleHint: '', childrenIds: [], relationshipType: 'Married', relationshipStatus: 'active', events: [{ id: 'rel-rupert-mabel-partner-marriage', eventType: 'Marriage', gedcomTag: 'MARR', typeLabel: 'Civil', date: { date: '', dateLabel: '', dateType: 'Exact date', calendar: 'Gregorian', originalText: '' }, placeId: null, placeText: '', sortDate: '', confidence: '' }], nonEvents: [], createdAt: '', updatedAt: '' },
        { id: 'rel-silver-luna-partner', projectId: 'p1', type: 'family', gedcomXref: '@FRELSILVERLUNAPARTNER@', partnerAId: 'silver', partnerBId: 'luna', personAId: 'silver', personBId: 'luna', partnerARoleHint: '', partnerBRoleHint: '', childrenIds: [], relationshipType: 'Married', relationshipStatus: 'active', events: [{ id: 'rel-silver-luna-partner-marriage', eventType: 'Marriage', gedcomTag: 'MARR', typeLabel: 'Civil', date: { date: '18.08.2023', dateLabel: '18 Aug 2023', dateType: 'Exact date', calendar: 'Gregorian', originalText: '18 Aug 2023' }, placeId: 'place-meowbridge', placeText: '', sortDate: '', confidence: '' }], nonEvents: [], createdAt: '', updatedAt: '' },
        { id: 'rel-solomon-opal-partner', projectId: 'p1', type: 'family', gedcomXref: '@FRELSOLOMONOPALPARTNER@', partnerAId: 'solomon', partnerBId: 'opal', personAId: 'solomon', personBId: 'opal', partnerARoleHint: '', partnerBRoleHint: '', childrenIds: [], relationshipType: 'Married', relationshipStatus: 'active', events: [{ id: 'rel-solomon-opal-partner-marriage', eventType: 'Marriage', gedcomTag: 'MARR', typeLabel: 'Civil', date: { date: '', dateLabel: '', dateType: 'Exact date', calendar: 'Gregorian', originalText: '' }, placeId: 'place-old-cattery', placeText: '', sortDate: '', confidence: '' }], nonEvents: [], createdAt: '', updatedAt: '' },
        { id: 'rel-tobias-marigold-partner', projectId: 'p1', type: 'family', gedcomXref: '@FRELTOBIASMARIGOLDPARTNER@', partnerAId: 'tobias', partnerBId: 'marigold', personAId: 'tobias', personBId: 'marigold', partnerARoleHint: '', partnerBRoleHint: '', childrenIds: [], relationshipType: 'Married', relationshipStatus: 'active', events: [{ id: 'rel-tobias-marigold-partner-marriage', eventType: 'Marriage', gedcomTag: 'MARR', typeLabel: 'Civil', date: { date: '', dateLabel: '', dateType: 'Exact date', calendar: 'Gregorian', originalText: '' }, placeId: 'place-meowbridge', placeText: '', sortDate: '', confidence: '' }], nonEvents: [], createdAt: '', updatedAt: '' },
        { id: 'rel-archibald-barnaby-parent', projectId: 'p1', type: 'parentChild', parentId: 'archibald', childId: 'barnaby', parentRole: 'father' },
        { id: 'rel-edith-barnaby-parent', projectId: 'p1', type: 'parentChild', parentId: 'edith', childId: 'barnaby', parentRole: 'mother' },
        { id: 'rel-percival-daisy-parent', projectId: 'p1', type: 'parentChild', parentId: 'percival', childId: 'daisy', parentRole: 'father' },
        { id: 'rel-nora-daisy-parent', projectId: 'p1', type: 'parentChild', parentId: 'nora', childId: 'daisy', parentRole: 'mother' },
        { id: 'rel-algernon-rupert-parent', projectId: 'p1', type: 'parentChild', parentId: 'algernon', childId: 'rupert', parentRole: 'father' },
        { id: 'rel-beatrice-rupert-parent', projectId: 'p1', type: 'parentChild', parentId: 'beatrice', childId: 'rupert', parentRole: 'mother' },
        { id: 'rel-felix-mabel-parent', projectId: 'p1', type: 'parentChild', parentId: 'felix', childId: 'mabel', parentRole: 'father' },
        { id: 'rel-pearl-mabel-parent', projectId: 'p1', type: 'parentChild', parentId: 'pearl', childId: 'mabel', parentRole: 'mother' },
        { id: 'rel-barnaby-silver-parent', projectId: 'p1', type: 'parentChild', parentId: 'barnaby', childId: 'silver', parentRole: 'father' },
        { id: 'rel-daisy-silver-parent', projectId: 'p1', type: 'parentChild', parentId: 'daisy', childId: 'silver', parentRole: 'mother' },
        { id: 'rel-rupert-luna-parent', projectId: 'p1', type: 'parentChild', parentId: 'rupert', childId: 'luna', parentRole: 'father' },
        { id: 'rel-mabel-luna-parent', projectId: 'p1', type: 'parentChild', parentId: 'mabel', childId: 'luna', parentRole: 'mother' },
        { id: 'rel-silver-oliver-parent', projectId: 'p1', type: 'parentChild', parentId: 'silver', childId: 'oliver', parentRole: 'father' },
        { id: 'rel-luna-oliver-parent', projectId: 'p1', type: 'parentChild', parentId: 'luna', childId: 'oliver', parentRole: 'mother' },
        { id: 'rel-silver-mochi-parent', projectId: 'p1', type: 'parentChild', parentId: 'silver', childId: 'mochi', parentRole: 'father' },
        { id: 'rel-luna-mochi-parent', projectId: 'p1', type: 'parentChild', parentId: 'luna', childId: 'mochi', parentRole: 'mother' },
        { id: 'rel-silver-cleo-parent', projectId: 'p1', type: 'parentChild', parentId: 'silver', childId: 'cleo', parentRole: 'father' },
        { id: 'rel-luna-cleo-parent', projectId: 'p1', type: 'parentChild', parentId: 'luna', childId: 'cleo', parentRole: 'mother' },
        { id: 'rel-solomon-pearl-parent', projectId: 'p1', type: 'parentChild', parentId: 'solomon', childId: 'pearl', parentRole: 'father' },
        { id: 'rel-opal-pearl-parent', projectId: 'p1', type: 'parentChild', parentId: 'opal', childId: 'pearl', parentRole: 'mother' },
        { id: 'rel-horatio-beatrice-parent', projectId: 'p1', type: 'parentChild', parentId: 'horatio', childId: 'beatrice', parentRole: 'father' },
        { id: 'rel-clementine-algernon-parent', projectId: 'p1', type: 'parentChild', parentId: 'clementine', childId: 'algernon', parentRole: 'mother' },
        { id: 'rel-augustus-archibald-parent', projectId: 'p1', type: 'parentChild', parentId: 'augustus', childId: 'archibald', parentRole: 'father' },
        { id: 'rel-tobias-nora-parent', projectId: 'p1', type: 'parentChild', parentId: 'tobias', childId: 'nora', parentRole: 'father' },
        { id: 'rel-marigold-nora-parent', projectId: 'p1', type: 'parentChild', parentId: 'marigold', childId: 'nora', parentRole: 'mother' }
    ],
    places: [
        { id: 'place-pawford', projectId: 'p1', createdAt: '2025-01-12T10:00:00Z', name: 'Pawford, North Yorkshire, England', alternativeNames: ['Pawford town'], coordinates: { lat: 53.9594, lng: -1.082 }, updatedAt: '2026-05-10T00:00:00Z', deleted: false },
        { id: 'place-meowbridge', projectId: 'p1', createdAt: '2025-01-12T10:00:00Z', name: 'Meowbridge, North Yorkshire, England', alternativeNames: ['Meow Bridge'], coordinates: { lat: 53.9948, lng: -1.1347 }, updatedAt: '2026-05-08T00:00:00Z', deleted: false },
        { id: 'place-fishmarket-row', projectId: 'p1', createdAt: '2025-01-12T10:00:00Z', name: 'Fishmarket Row, North Yorkshire, England', alternativeNames: ['Fish Market Row'], coordinates: { lat: 53.9369, lng: -1.1118 }, updatedAt: '2026-05-06T00:00:00Z', deleted: false },
        { id: 'place-old-cattery', projectId: 'p1', createdAt: '2025-01-12T10:00:00Z', name: 'Old Cattery, North Yorkshire, England', alternativeNames: ['The Old Cattery'], coordinates: { lat: 54.0182, lng: -1.0376 }, updatedAt: '2026-05-04T00:00:00Z', deleted: false },
        { id: 'place-unknown', projectId: 'p1', createdAt: '2025-01-12T10:00:00Z', name: 'Unidentified village near Pawford, North Yorkshire, England', alternativeNames: ['Village near Pawford'], coordinates: null, updatedAt: '2026-04-25T00:00:00Z', deleted: false },
        { id: 'place-pawford-garden', projectId: 'p1', createdAt: '2025-01-12T10:00:00Z', name: 'Whiskerfield family garden, Pawford, North Yorkshire, England', alternativeNames: ['Pawford family garden'], coordinates: null, updatedAt: '2026-05-04T00:00:00Z', deleted: false },
        { id: 'place-meowbridge-school', projectId: 'p1', createdAt: '2025-01-12T10:00:00Z', name: 'Meowbridge School, North Yorkshire, England', alternativeNames: ['Meowbridge school'], coordinates: null, updatedAt: '2026-05-05T00:00:00Z', deleted: false },
        { id: 'place-archive', projectId: 'p1', createdAt: '2025-01-12T10:00:00Z', name: 'Pawford County Archive, North Yorkshire, England', alternativeNames: ['Pawford archive'], coordinates: { lat: 54.3393, lng: -1.4322 }, updatedAt: '2026-05-01T00:00:00Z', deleted: false },
        { id: 'place-residence', projectId: 'p1', createdAt: '2025-01-12T10:00:00Z', name: 'Whiskerfield residence near Pawford, North Yorkshire, England', alternativeNames: ['Whiskerfield family house'], coordinates: { lat: 53.985, lng: -1.105 }, updatedAt: '2026-04-28T00:00:00Z', deleted: false },
        { id: 'place-cemetery', projectId: 'p1', createdAt: '2025-01-12T10:00:00Z', name: 'Pawford Cemetery, North Yorkshire, England', alternativeNames: ['Pawford burial ground'], coordinates: { lat: 53.94978, lng: -1.07004 }, updatedAt: '2026-04-20T00:00:00Z', deleted: false },
        { id: 'place-deleted', projectId: 'p1', createdAt: '2025-01-12T10:00:00Z', name: 'Pawford, North Yorkshire, England', alternativeNames: ['Duplicate Pawford record'], coordinates: { lat: 53.9594, lng: -1.082 }, updatedAt: '2026-04-12T00:00:00Z', deleted: true }
    ],
    placeSavedFilters: [
        {
            id: 'place-filter-whiskerfield',
            projectId: 'p1',
            name: 'Whiskerfield places',
            description:
            'Places connected to members of the Whiskerfield family.',
            filters: {
                surname: 'Whiskerfield'
            },
            createdAt: '2026-05-01T00:00:00Z',
            updatedAt: '2026-05-01T00:00:00Z'
        },

        {
            id: 'place-filter-silver',
            projectId: 'p1',
            name: 'Silver\'s places',
            description:
            'Places connected to Silver Whiskerfield.',
            filters: {
                personId: 'silver'
            },
            createdAt: '2026-05-01T00:00:00Z',
            updatedAt: '2026-05-01T00:00:00Z'
        },

        {
            id: 'place-filter-historic',
            projectId: 'p1',
            name: 'Historic family places',
            description:
            'Places linked to events before 1900.',
            filters: {
                yearTo: '1899'
            },
            createdAt: '2026-05-01T00:00:00Z',
            updatedAt: '2026-05-01T00:00:00Z'
        },

        {
            id: 'place-filter-unmapped-review',
            projectId: 'p1',
            name: 'Unmapped places',
            description:
            'Places that do not yet have coordinates.',
            filters: {
                mapped: 'unmapped'
            },
            createdAt: '2026-05-01T00:00:00Z',
            updatedAt: '2026-05-01T00:00:00Z'
        }
    ],
    placeIssues: [],
    events: [],
    educationSeed: [
        {
            id: 'education-silver-pawford-tutoring',
            projectId: 'p1',
            personId: 'silver',
            date: '2004',
            dateLabel: '2004',
            placeId: 'place-pawford',
            value: 'Private tutoring',
            type: 'Private tutoring',
            institutionName: 'Pawford tutoring circle',
            institutionType: 'Private tutoring',
            title: 'Education',
            description: 'Started at Pawford tutoring circle'
        },
        {
            id: 'education-luna-meowbridge-school',
            projectId: 'p1',
            personId: 'luna',
            date: '2005',
            dateLabel: '2005',
            placeId: 'place-meowbridge',
            value: 'School education',
            type: 'School',
            institutionName: 'Meowbridge School',
            institutionType: 'School',
            title: 'Education',
            description: 'Studied in Meowbridge'
        }
    ],
    media: [
        { id: 'photo-silver-portrait', projectId: 'p1', kind: 'photo', title: 'Silver portrait', filename: 'silver-portrait.jpg', src: './assets/photos/silver-portrait.jpg', mimeType: 'image/jpeg', width: 1400, height: 1800, sizeBytes: 168960, personIds: ['silver'], personRegions: { silver: { x: 0.08, y: 0.01, width: 0.84, height: 0.78 } }, albumIds: ['al-family', 'al-personal'], date: { date: '03.03.1998', dateLabel: '03 Mar 1998', dateType: 'Exact date', fromDate: '', toDate: '' }, placeId: 'place-pawford', placeText: 'Pawford', caption: 'Portrait of Silver Whiskerfield.', favorite: true, createdAt: '2026-05-01T10:00:00Z', updatedAt: '2026-05-01T10:00:00Z' },
        { id: 'photo-family-table', projectId: 'p1', kind: 'photo', title: 'Family table', filename: 'family-table-2010.jpg', src: './assets/photos/family-table-2025.jpg', mimeType: 'image/jpeg', width: 2400, height: 1350, sizeBytes: 3984588, personIds: ['silver', 'luna', 'pearl'], personRegions: { silver: { x: 0.06, y: 0.52, width: 0.26, height: 0.27 }, luna: { x: 0.59, y: 0.26, width: 0.23, height: 0.33 }, pearl: { x: 0.25, y: 0.14, width: 0.18, height: 0.24 } }, albumIds: ['al-family', 'al-personal'], date: { date: '2010', dateLabel: '2010', dateType: 'Exact date', fromDate: '', toDate: '' }, placeId: 'place-meowbridge', placeText: 'Meowbridge', caption: 'Family table after a celebration.', favorite: true, createdAt: '2026-04-18T09:30:00Z', updatedAt: '2026-05-02T11:10:00Z' },
        { id: 'photo-barnaby-portrait', projectId: 'p1', kind: 'photo', title: 'Barnaby portrait', filename: 'barnaby-portrait.jpg', src: './assets/photos/barnaby-portrait.jpg', mimeType: 'image/jpeg', width: 1200, height: 1600, sizeBytes: 1228800, personIds: ['barnaby'], personRegions: { barnaby: { x: 0.53, y: 0.04, width: 0.43, height: 0.32 } }, albumIds: ['al-grandma', 'al-portraits'], date: { date: '1975', dateLabel: '1975', dateType: 'About / Circa', fromDate: '', toDate: '' }, placeId: 'place-pawford', placeText: 'Pawford', caption: 'Barnaby Whiskerfield in Pawford.', favorite: false, createdAt: '2026-05-03T08:00:00Z', updatedAt: '2026-05-03T08:00:00Z' },
        { id: 'photo-luna-portrait', projectId: 'p1', kind: 'photo', title: 'Luna portrait', filename: 'luna-portrait.jpg', src: './assets/photos/luna-portrait.jpg', mimeType: 'image/jpeg', width: 1300, height: 1700, sizeBytes: 1480000, personIds: ['luna'], personRegions: { luna: { x: 0.16, y: 0.03, width: 0.56, height: 0.58 } }, albumIds: ['al-personal'], date: { date: '2018', dateLabel: '2018', dateType: 'After', fromDate: '', toDate: '' }, placeId: 'place-meowbridge', placeText: 'Meowbridge', caption: 'Portrait of Luna Purrington.', favorite: false, createdAt: '2026-04-30T12:00:00Z', updatedAt: '2026-04-30T12:00:00Z' },
        { id: 'photo-grandparents-garden', projectId: 'p1', kind: 'photo', title: 'Grandparents in the garden', filename: 'grandparents-garden.jpg', src: './assets/photos/grandparents-garden.jpg', mimeType: 'image/jpeg', width: 2100, height: 1400, sizeBytes: 2200000, personIds: ['barnaby', 'daisy'], personRegions: { barnaby: { x: 0.35, y: 0.08, width: 0.27, height: 0.35 }, daisy: { x: 0.62, y: 0.2, width: 0.27, height: 0.37 } }, albumIds: ['al-family', 'al-grandma'], date: { date: '', dateLabel: '', dateType: 'Between', fromDate: '1970', toDate: '1975' }, placeId: 'place-pawford-garden', placeText: 'Pawford garden', caption: 'Barnaby and Daisy in the family garden.', favorite: true, createdAt: '2026-05-04T14:00:00Z', updatedAt: '2026-05-04T14:00:00Z' },
        { id: 'photo-daisy-school', projectId: 'p1', kind: 'photo', title: 'Daisy school portrait', filename: 'daisy-school-portrait.jpg', src: './assets/photos/daisy-school-portrait.jpg', mimeType: 'image/jpeg', width: 1100, height: 1500, sizeBytes: 980000, personIds: ['daisy'], personRegions: { daisy: { x: 0.17, y: 0.18, width: 0.72, height: 0.53 } }, albumIds: ['al-grandma', 'al-portraits'], date: { date: '1960', dateLabel: '1960', dateType: 'Before', fromDate: '', toDate: '' }, placeId: 'place-meowbridge-school', placeText: 'Meowbridge school', caption: 'Early portrait of Daisy Milkpaw.', favorite: false, createdAt: '2026-05-05T10:15:00Z', updatedAt: '2026-05-05T10:15:00Z' },
        { id: 'photo-silver-luna-wedding', projectId: 'p1', kind: 'photo', title: 'Silver and Luna', filename: 'silver-luna-wedding.jpg', src: './assets/photos/silver-luna-wedding.jpg', mimeType: 'image/jpeg', width: 2000, height: 1333, sizeBytes: 2450000, personIds: ['silver', 'luna'], personRegions: { silver: { x: 0.18, y: 0.14, width: 0.4, height: 0.31 }, luna: { x: 0.6, y: 0.12, width: 0.31, height: 0.33 } }, albumIds: ['al-family', 'al-personal'], date: { date: '18.08.2023', dateLabel: '18 Aug 2023', dateType: 'Exact date', fromDate: '', toDate: '' }, placeId: 'place-meowbridge', placeText: 'Meowbridge', caption: 'Silver and Luna at their wedding celebration.', favorite: true, createdAt: '2026-05-06T16:45:00Z', updatedAt: '2026-05-06T16:45:00Z' },
        { id: 'photo-purrington-family', projectId: 'p1', kind: 'photo', title: 'Purrington family visit', filename: 'purrington-family-visit.jpg', src: './assets/photos/purrington-family-visit.jpg', mimeType: 'image/jpeg', width: 2300, height: 1500, sizeBytes: 3100000, personIds: ['pearl', 'silver'], personRegions: { pearl: { x: 0.18, y: 0.12, width: 0.26, height: 0.33 }, silver: { x: 0.72, y: 0.37, width: 0.26, height: 0.38 } }, albumIds: ['al-family'], date: { date: '2008', dateLabel: '2008', dateType: 'Exact date', fromDate: '', toDate: '' }, placeId: 'place-fishmarket-row', placeText: 'Fishmarket Row', caption: 'A Purrington family visit.', favorite: false, createdAt: '2026-05-07T09:00:00Z', updatedAt: '2026-05-07T09:00:00Z' },
        { id: 'photo-oliver-portrait', projectId: 'p1', kind: 'photo', title: 'Oliver portrait', filename: 'oliver-portrait.jpg', src: './assets/photos/oliver-portrait.jpg', mimeType: 'image/jpeg', width: 1250, height: 1600, sizeBytes: 1170000, personIds: ['oliver'], personRegions: { oliver: { x: 0.16, y: 0, width: 0.68, height: 0.55 } }, albumIds: ['al-personal'], date: { date: '18.05.2024', dateLabel: '18 May 2024', dateType: 'Exact date', fromDate: '', toDate: '' }, placeId: 'place-pawford', placeText: 'Pawford', caption: 'Oliver Whiskerfield portrait.', favorite: false, createdAt: '2026-05-08T13:00:00Z', updatedAt: '2026-05-08T13:00:00Z' },
        { id: 'photo-pearl-portrait', projectId: 'p1', kind: 'photo', title: 'Pearl portrait', filename: 'pearl-portrait.jpg', src: './assets/photos/pearl-portrait.jpg', mimeType: 'image/jpeg', width: 1000, height: 1450, sizeBytes: 910000, personIds: ['pearl'], personRegions: { pearl: { x: 0.11, y: 0.07, width: 0.52, height: 0.42 } }, albumIds: ['al-portraits'], date: { date: '1950', dateLabel: '1950', dateType: 'About / Circa', fromDate: '', toDate: '' }, placeId: 'place-old-cattery', placeText: 'Old Cattery', caption: 'Portrait identified as Pearl Velvetpaw.', favorite: false, createdAt: '2026-05-09T10:00:00Z', updatedAt: '2026-05-09T10:00:00Z' },
        { id: 'photo-young-family', projectId: 'p1', kind: 'photo', title: 'Young Whiskerfield family', filename: 'young-whiskerfield-family.jpg', src: './assets/photos/young-whiskerfield-family.jpg', mimeType: 'image/jpeg', width: 2600, height: 1700, sizeBytes: 4300000, personIds: ['silver', 'luna', 'oliver', 'mochi', 'cleo'], personRegions: { silver: { x: 0.19, y: 0.09, width: 0.34, height: 0.38 }, luna: { x: 0.52, y: 0.05, width: 0.29, height: 0.38 }, oliver: { x: 0.3, y: 0.51, width: 0.24, height: 0.24 }, mochi: { x: 0.5, y: 0.49, width: 0.2, height: 0.27 }, cleo: { x: 0.69, y: 0.56, width: 0.23, height: 0.24 } }, albumIds: ['al-family', 'al-personal'], date: { date: '2026', dateLabel: '2026', dateType: 'Exact date', fromDate: '', toDate: '' }, placeId: 'place-pawford', placeText: 'Pawford', caption: 'The young Whiskerfield household.', favorite: false, createdAt: '2026-05-10T15:30:00Z', updatedAt: '2026-05-10T15:30:00Z' },
        { id: 'photo-unidentified-studio', projectId: 'p1', kind: 'photo', title: 'Unidentified studio portrait', filename: 'unidentified-studio-portrait.jpg', src: './assets/photos/unidentified-studio-portrait.jpg', mimeType: 'image/jpeg', width: 900, height: 1300, sizeBytes: 740000, personIds: [], albumIds: ['al-portraits'], date: { date: '', dateLabel: '', dateType: 'Exact date', fromDate: '', toDate: '' }, placeId: 'place-unknown', placeText: 'North quay studio', caption: 'Unidentified portrait awaiting research.', favorite: false, createdAt: '2026-05-11T11:00:00Z', updatedAt: '2026-05-11T11:00:00Z' },
        { id: 'photo-archive-yard', projectId: 'p1', kind: 'photo', title: 'Archive storage', filename: 'archive-yard.jpg', src: './assets/photos/archive-yard.jpg', mimeType: 'image/jpeg', width: 1900, height: 1200, sizeBytes: 2050000, personIds: [], albumIds: [], date: { date: '1948', dateLabel: '1948', dateType: 'After', fromDate: '', toDate: '' }, placeId: 'place-pawford', placeText: 'Pawford', caption: 'View of the Pawford archive storage.', favorite: false, createdAt: '2026-05-12T09:20:00Z', updatedAt: '2026-05-12T09:20:00Z' },
        { id: 'photo-archibald-workshop', projectId: 'p1', kind: 'photo', title: 'Archibald at the workshop', filename: 'archibald-workshop.jpg', src: './assets/photos/archibald-workshop.jpg', mimeType: 'image/jpeg', width: 1800, height: 1200, sizeBytes: 1760000, personIds: ['archibald'], personRegions: { archibald: { x: 0.21, y: 0.08, width: 0.45, height: 0.43 } }, albumIds: [], date: { date: '1940', dateLabel: '1940', dateType: 'After', fromDate: '', toDate: '' }, placeId: 'place-pawford', placeText: 'Pawford', caption: 'Archibald Whiskerfield at his workshop.', favorite: false, createdAt: '2026-05-13T12:40:00Z', updatedAt: '2026-05-13T12:40:00Z' }
    ],
    albums: [
        { id: 'al-family', projectId: 'p1', name: 'Family photos', description: 'Shared family portraits and gatherings.', createdAt: '2026-05-08T10:00:00Z' },
        { id: 'al-grandma', projectId: 'p1', name: 'Family album', description: 'Old portraits and scans from the family album.', createdAt: '2026-05-11T10:00:00Z' },
        { id: 'al-personal', projectId: 'p1', name: 'Personal album', description: 'Personal album of Silver Whiskerfield.', createdAt: '2026-05-18T10:00:00Z' },
        { id: 'al-portraits', projectId: 'p1', name: 'Old portraits', description: 'Identified and unidentified historical portraits.', createdAt: '2026-05-21T10:00:00Z' },
        { id: 'al-scans', projectId: 'p1', name: 'Unsorted scans', description: 'Recently added scans waiting for review.', createdAt: '2026-06-02T10:00:00Z' }
    ],
    archiveFiles: [
        { id: 'archive-pawford-household-register', projectId: 'p1', title: 'Pawford household register', placeId: 'place-pawford', dateLabel: '1954', type: 'Register' },
        { id: 'archive-meowbridge-marriage-record', projectId: 'p1', title: 'Meowbridge marriage record', placeId: 'place-meowbridge', dateLabel: '18 Aug 2023', type: 'Marriage record' },
        { id: 'archive-old-cattery-burial-index', projectId: 'p1', title: 'Old Cattery burial index', placeId: 'place-old-cattery', dateLabel: '1961-2011', type: 'Burial index' },
        { id: 'archive-fishmarket-row-census-extract', projectId: 'p1', title: 'Fishmarket Row census extract', placeId: 'place-fishmarket-row', dateLabel: '1921', type: 'Census extract' }
    ],
    sources: [],
    sourceLinks: [],
    notes: [
    ],
    boards: [],
    links: [
        { id: 'link-silver-marriage-record', projectId: 'p1', fromType: 'person', fromId: 'silver', toType: 'archiveFile', toId: 'archive-meowbridge-marriage-record', label: 'Marriage record' },
        { id: 'link-luna-marriage-record', projectId: 'p1', fromType: 'person', fromId: 'luna', toType: 'archiveFile', toId: 'archive-meowbridge-marriage-record', label: 'Marriage record' },
        { id: 'link-pearl-burial-index', projectId: 'p1', fromType: 'person', fromId: 'pearl', toType: 'archiveFile', toId: 'archive-old-cattery-burial-index', label: 'Burial index' },
        { id: 'link-solomon-burial-index', projectId: 'p1', fromType: 'person', fromId: 'solomon', toType: 'archiveFile', toId: 'archive-old-cattery-burial-index', label: 'Burial index' },
        { id: 'link-augustus-household-register', projectId: 'p1', fromType: 'person', fromId: 'augustus', toType: 'archiveFile', toId: 'archive-pawford-household-register', label: 'Household register' },
        { id: 'link-clementine-census-extract', projectId: 'p1', fromType: 'person', fromId: 'clementine', toType: 'archiveFile', toId: 'archive-fishmarket-row-census-extract', label: 'Census extract' }
    ]
};

function getPeople(projectId)
{
    return projectId
        ? sampleData.people.filter(person => person.projectId === projectId)
        : [];
}

function getProjectPeopleCount(
    projectId = currentProjectId()
)
{
    if (!projectId)
    {
        return 0;
    }

    return getPeople(
        projectId
    ).length;
}

function formatProjectPeopleCount(
    projectId
)
{
    const count =
        getProjectPeopleCount(
            projectId
        );

    return `${count} ${
        count === 1
            ? 'person'
            : 'people'
    }`;
}

function getPerson(personId)
{
    return sampleData.people.find(person => person.id === personId) || null;
}

function getPersonDisplayName(personId)
{
    return getPerson(personId)?.names?.display || 'Unknown';
}

